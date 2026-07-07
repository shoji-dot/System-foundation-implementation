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

/**
 * PMDA「安全対策に関する通知等（医療機器）」取込アダプタ（設計書⑨ Source Adapter、JP向け）。
 *
 * ページ構造（2026-07-04時点、実ページをweb_fetchで確認済み）:
 * - {@link LIST_URL} は単一ページで全件（約120件、2001年〜2026年）を新しい順の2列表で掲載。
 *   ページネーションは無い。
 * - 列1: 発出年月日＋（あれば）通知番号。列2: 表題＋リンク（1セルに複数リンクの場合あり、添付等）。
 * - 新しい通知（概ね2009年以降）はPDF直リンク（例: https://www.pmda.go.jp/files/000280044.pdf）、
 *   古い通知はHTML詳細ページへのリンク（例: .../devices/0103.html）。
 * - 通知番号は全行にあるわけではないため、sourceDocId（doc_number相当、差分検出キー）は
 *   通知番号ではなくリンクURLの末尾セグメント（拡張子除く）から導出する（常に一意かつ存在するため）。
 *
 * 既知の未検証リスク: PMDAサイトのレスポンス文字コードがShift_JISの場合、`fetch().text()`は
 * UTF-8前提でデコードするため文字化けする可能性がある。ローカル実行環境で実レスポンスを確認し、
 * 文字化けする場合は iconv-lite 等でのデコード処理を追加コミットで対応すること。
 */
@Injectable()
export class PmdaRegulatorySource implements RegulatorySource {
  readonly sourceId = "PMDA_DEVICE_SAFETY_NOTICES";

  private static readonly LIST_URL =
    "https://www.pmda.go.jp/safety/info-services/devices/0001.html";

  private readonly logger = new Logger(PmdaRegulatorySource.name);

  async fetchList(): Promise<SourceListItem[]> {
    const response = await fetch(PmdaRegulatorySource.LIST_URL);
    if (!response.ok) {
      this.logger.warn(
        `PMDA通知一覧の取得に失敗しました（status: ${response.status}）: ${PmdaRegulatorySource.LIST_URL}`,
      );
      throw new Error(`PMDA通知一覧の取得に失敗しました（status: ${response.status}）`);
    }

    const html = await response.text();
    return this.parseList(html);
  }

  async fetchDocument(item: SourceListItem): Promise<SourceDocument> {
    const response = await fetch(item.sourceUrl);
    if (!response.ok) {
      this.logger.warn(
        `PMDA文書の取得に失敗しました（status: ${response.status}）: ${item.sourceUrl}`,
      );
      throw new Error(`PMDA文書の取得に失敗しました（status: ${response.status}）`);
    }

    // 実ページ確認済みの通り、新しい通知はPDF直リンク・古い通知はHTML詳細ページのため拡張子で判別する。
    const isPdf = item.sourceUrl.toLowerCase().endsWith(".pdf");
    const rawContent = isPdf
      ? await this.extractPdfText(await response.arrayBuffer())
      : this.extractHtmlText(await response.text());

    return {
      sourceDocId: item.sourceDocId,
      sourceUrl: item.sourceUrl,
      rawContent,
      fetchedAt: new Date(),
    };
  }

  normalize(item: SourceListItem, document: SourceDocument): Promise<NormalizedRegulationDocument> {
    return Promise.resolve({
      // このAdapterは常にJP/PMDAの安全対策通知のみを扱う（design doc⑨、他国はAdapter追加で対応）。
      jurisdiction: "JP",
      type: "NOTICE",
      subtype: null,
      title: item.title,
      // 通知番号が無い行があるため（実ページ確認済み）、その場合はsourceDocId（常に存在）で代替する。
      docNumber: item.noticeNumbers.length > 0 ? item.noticeNumbers.join(" / ") : item.sourceDocId,
      effectiveDate: item.issuedAt,
      sourceUrl: item.sourceUrl,
      fullText: document.rawContent,
      contentHash: this.computeContentHash(document.rawContent),
    });
  }

  /** PDFバイナリから本文テキストを抽出する。 */
  private async extractPdfText(buffer: ArrayBuffer): Promise<string> {
    const result = await pdfParse(Buffer.from(buffer));
    return result.text.trim();
  }

  /** HTML本文からタグを除いたテキストを抽出する（空白は連続1個に正規化）。 */
  private extractHtmlText(html: string): string {
    const $ = cheerio.load(html);
    return $("body").text().replace(/\s+/g, " ").trim();
  }

  /** 差分検出用ハッシュ（設計書⑨「差分検出（doc_number+ハッシュ比較）」）。 */
  private computeContentHash(text: string): string {
    return createHash("sha256").update(text, "utf8").digest("hex");
  }

  /**
   * 一覧ページのHTMLをパースする。ユニットテストで実ページ無しでも検証できるようpublicにしている。
   */
  parseList(html: string): SourceListItem[] {
    const $ = cheerio.load(html);
    const items: SourceListItem[] = [];

    $("table tr").each((_index, row) => {
      const cells = $(row).find("td");
      // ヘッダー行（thのみ）や表構造外の行はスキップする。
      if (cells.length < 2) {
        return;
      }

      // 列1（発出年月日＋通知番号）を<br>区切りの行に分解する。1行目が日付、以降が通知番号（0件以上）。
      // contents()で実ノード(text/br要素)を辿る方式を採る。プレーンテキスト断片を
      // $(fragment)で再パースするとcheerioがCSSセレクタと誤解釈しうるため、その方式は避ける。
      const dateCellLines: string[] = [];
      let currentLine = "";
      cells
        .eq(0)
        .contents()
        .each((_nodeIndex, node) => {
          if (node.type === "tag" && node.name === "br") {
            if (currentLine.trim().length > 0) {
              dateCellLines.push(currentLine.trim());
            }
            currentLine = "";
            return;
          }
          currentLine += $(node).text();
        });
      if (currentLine.trim().length > 0) {
        dateCellLines.push(currentLine.trim());
      }
      const { issuedAt, noticeNumbers } = this.groupDateCellLines(dateCellLines);

      const linkCell = cells.eq(1);
      linkCell.find("a").each((_linkIndex, anchor) => {
        const href = $(anchor).attr("href");
        const title = $(anchor).text().trim();
        if (!href || !title) {
          return;
        }

        const sourceUrl = new URL(href, PmdaRegulatorySource.LIST_URL).toString();
        const sourceDocId = this.deriveSourceDocId(sourceUrl);
        if (!sourceDocId) {
          return;
        }

        items.push({ sourceDocId, title, sourceUrl, issuedAt, noticeNumbers });
      });
    });

    return items;
  }

  /**
   * 列1から抽出済みの行配列を解釈する（1行目=発出年月日、以降=通知番号、実ページ確認済みの構造）。
   * 純粋な文字列処理のみで、cheerioの型に一切依存しない。
   */
  private groupDateCellLines(lines: string[]): {
    issuedAt: Date | null;
    noticeNumbers: string[];
  } {
    const [dateLine, ...noticeNumbers] = lines;
    return {
      issuedAt: dateLine ? this.parseJapaneseDate(dateLine) : null,
      noticeNumbers,
    };
  }

  /** 「YYYY年M月D日」形式の日本語日付をUTC日付として解釈する。解釈できない場合はnull。 */
  private parseJapaneseDate(text: string): Date | null {
    const match = /^(\d{4})年(\d{1,2})月(\d{1,2})日$/.exec(text);
    if (!match) {
      return null;
    }
    const [, year, month, day] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  /** URLの最終パスセグメント（拡張子除く）を doc_number 相当の識別子として使う。 */
  private deriveSourceDocId(url: string): string | null {
    const fileName = new URL(url).pathname.split("/").pop();
    if (!fileName) {
      return null;
    }
    return fileName.replace(/\.[^.]+$/, "");
  }
}
