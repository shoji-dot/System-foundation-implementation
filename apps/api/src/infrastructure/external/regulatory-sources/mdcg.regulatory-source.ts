import { createHash } from "node:crypto";

import { Injectable, Logger } from "@nestjs/common";
import * as cheerio from "cheerio";
import pdfParse from "pdf-parse";

import type {
  NormalizedRegulationDocument,
  RegulatorySource,
  SourceDocument,
  SourceListItem,
} from "../../../core/domain/regulatory-source";

const MONTH_NAMES: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/**
 * MDCG（Medical Device Coordination Group）ガイダンス取込アダプタ（設計書⑨ Source Adapter、
 * EU向け、設計書⑮ Phase6「多国Adapter追加」）。
 *
 * データソース: 欧州委員会の公開ガイダンス一覧ページ（{@link LIST_URL}、2026-07-08にChrome DevTools
 * (`document.querySelectorAll('table')`)で実ページのDOM構造を直接確認済み）。EUR-Lex（法令本体、
 * CELLAR RDF/SPARQL経由）は今回のスコープ外とする（要ユーザー確認: EUR-Lexは構造化APIはあるが
 * 法令本体テキストの取得がSPARQL+CELLAR RESTの組み合わせで複雑かつ本セッションでは実レスポンス構造を
 * 検証できていないため、MDCGガイダンス（PMDA Adapterと同じくHTML表からのスクレイピングで完結し、
 * 実ページ確認により構造を確定できた）を先行実装する。EUR-Lex対応は必要になった時点で別Adapter
 * （sourceId: 例 EU_EUR_LEX）として追加する）。
 *
 * ページ構造（2026-07-08確認）: セクション毎に独立した`<table>`が21個存在し（合計143行）、
 * 各行は3列固定（1列目: MDCG番号ラベル+PDFへのリンク、2列目: タイトル、3列目: "Month Year"形式の日付）。
 * 一部の行（COVID-19対応期の暫定文書等）は2列目が空で、1列目のリンクテキスト自体がタイトルを兼ねる
 * （実ページで確認済み、normalizeより前のfetchList側でtitle決定時に吸収する）。
 * ファイル形式はPDFが大半だが一部xlsx/docx（EMDN改版履歴等）もあり、本文抽出方式が異なるため
 * 今回はPDFのみを対象とする（143行中18行がPDF以外、要ユーザー確認: xlsx/docx対応は必要になった時点で
 * 別コミットで検討）。
 *
 * 全143行(うちPDF約125件)はPMDA一覧（約120件）と同程度の規模のため、FDA Adapterのような
 * 日付範囲での絞り込みは行わず、PMDA Adapterと同じく一覧を毎回全件取得する
 * （既知の制約としてPMDA実装と同じ理由、docNumber+ハッシュ比較で内容不変分はDB書き込みされない）。
 */
@Injectable()
export class MdcgRegulatorySource implements RegulatorySource {
  readonly sourceId = "EU_MDCG_GUIDANCE";

  private static readonly LIST_URL =
    "https://health.ec.europa.eu/medical-devices-sector/new-regulations/guidance-mdcg-endorsed-documents-and-other-guidance_en";

  private readonly logger = new Logger(MdcgRegulatorySource.name);

  async fetchList(): Promise<SourceListItem[]> {
    const response = await fetch(MdcgRegulatorySource.LIST_URL);
    if (!response.ok) {
      this.logger.warn(
        `MDCGガイダンス一覧の取得に失敗しました（status: ${response.status}）: ${MdcgRegulatorySource.LIST_URL}`,
      );
      throw new Error(`MDCGガイダンス一覧の取得に失敗しました（status: ${response.status}）`);
    }

    const html = await response.text();
    return this.parseList(html);
  }

  async fetchDocument(item: SourceListItem): Promise<SourceDocument> {
    const response = await fetch(item.sourceUrl);
    if (!response.ok) {
      this.logger.warn(
        `MDCG文書の取得に失敗しました（status: ${response.status}）: ${item.sourceUrl}`,
      );
      throw new Error(`MDCG文書の取得に失敗しました（status: ${response.status}）`);
    }

    // fetchListでfilename=*.pdfの行のみに絞り込み済みのため、常にPDFとして扱う。
    const rawContent = await this.extractPdfText(await response.arrayBuffer());

    return {
      sourceDocId: item.sourceDocId,
      sourceUrl: item.sourceUrl,
      rawContent,
      fetchedAt: new Date(),
    };
  }

  normalize(item: SourceListItem, document: SourceDocument): Promise<NormalizedRegulationDocument> {
    return Promise.resolve({
      // このAdapterは常にEU/MDCGガイダンスのみを扱う（設計書④ RegulationTypeのGUIDANCEに対応）。
      jurisdiction: "EU",
      type: "GUIDANCE",
      subtype: null,
      title: item.title,
      docNumber: item.noticeNumbers.length > 0 ? item.noticeNumbers.join(" / ") : item.sourceDocId,
      effectiveDate: item.issuedAt,
      sourceUrl: item.sourceUrl,
      fullText: document.rawContent,
      contentHash: this.computeContentHash(document.rawContent),
    });
  }

  /** 一覧ページのHTMLをパースする。ユニットテストで実ページ無しでも検証できるようpublicにしている。 */
  parseList(html: string): SourceListItem[] {
    const $ = cheerio.load(html);
    const items: SourceListItem[] = [];

    $("table tr").each((_index, row) => {
      const cells = $(row).find("td");
      // ヘッダー行・区切り行（3列固定以外）はスキップする（実ページ確認済みの構造）。
      if (cells.length !== 3) {
        return;
      }

      const linkCell = cells.eq(0);
      const anchor = linkCell.find("a").first();
      const href = anchor.attr("href");
      if (!href) {
        return;
      }

      const absoluteUrl = new URL(href, MdcgRegulatorySource.LIST_URL);
      const filename = absoluteUrl.searchParams.get("filename") ?? "";
      if (!filename.toLowerCase().endsWith(".pdf")) {
        // xlsx/docx等はPDFと本文抽出方式が異なるため今回のスコープ外（クラスdocコメント参照）。
        return;
      }

      const sourceDocId = this.deriveSourceDocId(absoluteUrl.pathname);
      if (!sourceDocId) {
        return;
      }

      const label = linkCell.text().trim();
      const titleCellText = cells.eq(1).text().trim();
      // 一部の行（COVID-19対応期の暫定文書等）は2列目が空で、1列目のリンクテキストがタイトルを兼ねる。
      const title = titleCellText.length > 0 ? titleCellText : label;
      const noticeNumbers = titleCellText.length > 0 && label.length > 0 ? [label] : [];

      items.push({
        sourceDocId,
        title,
        sourceUrl: absoluteUrl.toString(),
        issuedAt: this.parseMonthYear(cells.eq(2).text().trim()),
        noticeNumbers,
      });
    });

    return items;
  }

  /** "/document/download/{uuid}_en" 形式のパスからdoc_number相当のUUIDを抽出する。 */
  private deriveSourceDocId(pathname: string): string | null {
    const segment = pathname.split("/").pop();
    if (!segment) {
      return null;
    }
    return segment.replace(/_en$/, "");
  }

  /** "June 2025"のような英語の月名+年をUTC月初日として解釈する。解釈できない場合はnull。 */
  private parseMonthYear(text: string): Date | null {
    const match = /^([A-Za-z]+)\s+(\d{4})$/.exec(text);
    if (!match) {
      return null;
    }
    const [, monthName, year] = match;
    if (!monthName || !year) {
      return null;
    }
    const month = MONTH_NAMES[monthName.toLowerCase()];
    if (month === undefined) {
      return null;
    }
    return new Date(Date.UTC(Number(year), month, 1));
  }

  private async extractPdfText(buffer: ArrayBuffer): Promise<string> {
    const result = await pdfParse(Buffer.from(buffer));
    return result.text.trim();
  }

  private computeContentHash(text: string): string {
    return createHash("sha256").update(text, "utf8").digest("hex");
  }
}
