import type { JurisdictionCode } from "./jurisdiction.entity";
import type { RegulationType } from "./regulation.entity";

/**
 * 薬事情報ソースアダプタのポート（設計書⑨ 準拠）。
 * 実装は infrastructure/external 配下の国別プラグイン（例: PmdaRegulatorySource, FdaRegulatorySource）。
 * usecase層は各国サイトのHTML/PDF/RSS構造に直接依存しない（設計書③の依存方向ルール）。
 * 国追加はこのインターフェースを実装するAdapterの追加のみで対応する（設計書⑨「国追加=Adapter追加のみ」）。
 * MVPはJPのみ稼働、他国はAdapter空実装（設計書⑨）。
 *
 * 2026-07-08: 複数Adapter対応（US Adapter追加）にあわせ、DIトークンをREGULATORY_SOURCESに変更した
 * （旧REGULATORY_SOURCE単数トークンは廃止）。登録された全Adapterの配列として注入し、
 * IngestionScheduler/IngestionProcessorがAdapterごとに個別ジョブを実行する。
 */

/**
 * fetchListが返す一覧項目。ページング等の取得方式の詳細はAdapter内部に隠蔽する。
 */
export interface SourceListItem {
  /** ソース側の文書識別子（doc_number相当、差分検出のキー）。 */
  sourceDocId: string;
  title: string;
  sourceUrl: string;
  /** 発出年月日（一覧から抽出できた場合。解釈できない場合はnull）。normalizeでeffectiveDateの元になる。 */
  issuedAt: Date | null;
  /** 通知番号（一覧に無い場合は空配列）。複数ある場合は全て保持する。normalizeでdocNumberの元になる。 */
  noticeNumbers: string[];
}

/**
 * fetchDocumentが返す生データ。normalize前の未加工コンテンツ。
 */
export interface SourceDocument {
  sourceDocId: string;
  sourceUrl: string;
  /** HTML/PDF等から抽出した正規化前の生テキスト。 */
  rawContent: string;
  fetchedAt: Date;
}

/**
 * normalizeが返す共通スキーマへの変換結果（設計書④ regulations/regulation_versions 準拠）。
 * このAdapterが対象とする法域は固定（例: PMDA実装なら常にJP）。
 */
export interface NormalizedRegulationDocument {
  jurisdiction: JurisdictionCode;
  type: RegulationType;
  /** 国別の文書タイプ差分吸収用（設計書⑧: 例 FDA Guidance, EU MDCG）。 */
  subtype: string | null;
  title: string;
  docNumber: string;
  effectiveDate: Date | null;
  sourceUrl: string;
  fullText: string;
  /** 差分検出用ハッシュ（設計書⑨「差分検出（doc_number+ハッシュ比較）」）。fullTextから算出する。 */
  contentHash: string;
}

/** 登録済み全Adapterを配列として注入するDIトークン（設計書⑨「国追加=Adapter追加のみ」）。 */
export const REGULATORY_SOURCES = Symbol("REGULATORY_SOURCES");

/**
 * 設計書⑨ Source Adapterインターフェース: `RegulatorySource { fetchList(); fetchDocument(); normalize(); }`。
 */
export interface RegulatorySource {
  /** このAdapterが扱うソース識別子（例: "PMDA_DEVICE_SAFETY_NOTICES"）。ingestion_jobs.sourceの値としても使う。 */
  readonly sourceId: string;
  /** ソース側の一覧（通知一覧・Federal Register等）を取得する。 */
  fetchList(): Promise<SourceListItem[]>;
  /** 一覧項目から文書本体（HTML/PDF/RSS）を取得する。 */
  fetchDocument(item: SourceListItem): Promise<SourceDocument>;
  /**
   * 取得した生データを共通スキーマへ変換する。
   * 設計書⑨は引数の詳細を規定していないが、title/発出年月日/通知番号はSourceDocument（本文のみ）ではなく
   * 一覧取得時点のSourceListItemが保持しているため、両方を受け取る形とする
   * （PDF/HTML本文からタイトル・日付を再抽出するのは不安定なため避ける）。
   */
  normalize(item: SourceListItem, document: SourceDocument): Promise<NormalizedRegulationDocument>;
}
