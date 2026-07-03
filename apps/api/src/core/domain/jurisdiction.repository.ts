import type { Jurisdiction } from "./jurisdiction.entity";

/**
 * リポジトリはインターフェースを domain 側に定義する（設計書③、Repository Pattern）。
 * 実装は infrastructure/database/repositories 配下（PrismaJurisdictionRepository）。
 */
export const JURISDICTION_REPOSITORY = Symbol("JURISDICTION_REPOSITORY");

export interface JurisdictionRepository {
  /** 法域コード順の全件取得（設計書⑤ GET /api/v1/jurisdictions、件数少なくページネーション不要）。 */
  findAll(): Promise<Jurisdiction[]>;
}
