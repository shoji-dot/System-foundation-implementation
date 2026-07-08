import { createHash } from "node:crypto";

import { Injectable, Logger } from "@nestjs/common";

import type {
  NormalizedRegulationDocument,
  RegulatorySource,
  SourceDocument,
  SourceListItem,
} from "../../../core/domain/regulatory-source";

/**
 * FDA Federal Register 取込アダプタ（設計書⑨ Source Adapter、US向け、設計書⑮ Phase6「多国Adapter追加」）。
 *
 * データソース: Federal Register API（{@link SEARCH_URL}、APIキー不要・無料・公式、
 * https://www.federalregister.gov/developers/documentation/api/v1 で実際にレスポンス構造を確認済み）。
 * PMDA Adapter（HTML/PDFスクレイピング）と異なり、Federal Register側が構造化JSONを提供するため
 * HTMLパースは不要。1件ごとの本文取得はdocument detail API経由で`raw_text_url`（プレーンテキスト）を
 * 取得してから別途fetchする2段構成（一覧APIには本文URLが含まれないため）。
 *
 * スコープ: `agencies=food-and-drug-administration` + `term=medical device` + `type=NOTICE`
 * （PMDA Adapterと同じくtype/subtype固定の単純な構成とする。Federal Registerの`type=RULE`
 * （官報Final Rule、機器クラス分類告示等）は、一覧APIがtype文字列を返さない詳細取得と別ステップに
 * 分かれるため素直に混在させるとPMDA実装より複雑化する。RULE対応は必要になった時点で
 * 別sourceId（例: FDA_FEDERAL_REGISTER_DEVICE_RULES）の追加Adapterとして対応する
 * （設計書⑨「国追加=Adapter追加のみ」と同じ考え方をtype単位にも適用、要ユーザー確認）。
 * さらに`publication_date[gte]`で直近{@link LOOKBACK_DAYS}日に絞り込む。FDA側の「medical device」該当
 * 通知は累計数千件規模でPMDA一覧（約120件、無期限累積）と異なり全件を毎日再取得するのは非現実的なため
 * （1件ごとにdocument detail + raw text の2回fetch、既存のFETCH_INTERVAL_MS=500msポリテネスと合わせると
 * 大量件数では日次ジョブの実行時間が破綻する）、日次cronの実行間隔に対して十分なマージンを持たせた
 * 7日分のみを対象とする。
 * 既知の制約: 直近7日分が1ページ（最大1000件）に収まる前提で、PMDA同様まず1ページ目のみ取得する
 * （超過時のページネーションは件数増加時に別コミットで対応）。
 */
@Injectable()
export class FdaRegulatorySource implements RegulatorySource {
  readonly sourceId = "FDA_FEDERAL_REGISTER_DEVICE_NOTICES";

  private static readonly SEARCH_URL = "https://www.federalregister.gov/api/v1/documents.json";
  private static readonly DOCUMENT_URL = "https://www.federalregister.gov/api/v1/documents";
  private static readonly LOOKBACK_DAYS = 7;

  private readonly logger = new Logger(FdaRegulatorySource.name);

  async fetchList(): Promise<SourceListItem[]> {
    const url = this.buildSearchUrl();
    const response = await fetch(url);
    if (!response.ok) {
      this.logger.warn(
        `FDA Federal Register一覧の取得に失敗しました（status: ${response.status}）: ${url}`,
      );
      throw new Error(`FDA Federal Register一覧の取得に失敗しました（status: ${response.status}）`);
    }

    const body = (await response.json()) as FederalRegisterSearchResponse;
    return body.results
      .filter((result) => result.type === "Notice")
      .map((result) => ({
        sourceDocId: result.document_number,
        title: result.title,
        sourceUrl: result.html_url,
        issuedAt: this.parsePublicationDate(result.publication_date),
        noticeNumbers: [],
      }));
  }

  async fetchDocument(item: SourceListItem): Promise<SourceDocument> {
    const detailUrl = `${FdaRegulatorySource.DOCUMENT_URL}/${item.sourceDocId}.json`;
    const detailResponse = await fetch(detailUrl);
    if (!detailResponse.ok) {
      this.logger.warn(
        `FDA文書詳細の取得に失敗しました（status: ${detailResponse.status}）: ${detailUrl}`,
      );
      throw new Error(`FDA文書詳細の取得に失敗しました（status: ${detailResponse.status}）`);
    }
    const detail = (await detailResponse.json()) as FederalRegisterDocumentDetail;

    const textResponse = await fetch(detail.raw_text_url);
    if (!textResponse.ok) {
      this.logger.warn(
        `FDA文書本文の取得に失敗しました（status: ${textResponse.status}）: ${detail.raw_text_url}`,
      );
      throw new Error(`FDA文書本文の取得に失敗しました（status: ${textResponse.status}）`);
    }
    const rawContent = (await textResponse.text()).trim();

    return {
      sourceDocId: item.sourceDocId,
      sourceUrl: item.sourceUrl,
      rawContent,
      fetchedAt: new Date(),
    };
  }

  normalize(item: SourceListItem, document: SourceDocument): Promise<NormalizedRegulationDocument> {
    return Promise.resolve({
      // このAdapterは常にUS/Federal RegisterのNoticeのみを扱う（型注釈のみ、fetchListで絞り込み済み）。
      jurisdiction: "US",
      type: "NOTICE",
      subtype: null,
      title: item.title,
      docNumber: item.sourceDocId,
      effectiveDate: item.issuedAt,
      sourceUrl: item.sourceUrl,
      fullText: document.rawContent,
      contentHash: this.computeContentHash(document.rawContent),
    });
  }

  private buildSearchUrl(): string {
    const params = new URLSearchParams();
    params.append("conditions[agencies][]", "food-and-drug-administration");
    params.append("conditions[term]", "medical device");
    params.append("conditions[type][]", "NOTICE");
    params.append("conditions[publication_date][gte]", this.lookbackDateString());
    params.append("order", "newest");
    params.append("per_page", "1000");
    return `${FdaRegulatorySource.SEARCH_URL}?${params.toString()}`;
  }

  private lookbackDateString(): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - FdaRegulatorySource.LOOKBACK_DAYS);
    return date.toISOString().slice(0, 10);
  }

  /** publication_dateは"YYYY-MM-DD"形式（Federal Register API実レスポンス確認済み）。 */
  private parsePublicationDate(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  private computeContentHash(text: string): string {
    return createHash("sha256").update(text, "utf8").digest("hex");
  }
}

interface FederalRegisterSearchResult {
  document_number: string;
  title: string;
  type: string;
  html_url: string;
  publication_date: string;
}

interface FederalRegisterSearchResponse {
  results: FederalRegisterSearchResult[];
}

interface FederalRegisterDocumentDetail {
  raw_text_url: string;
}
