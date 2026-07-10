import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { LifecyclePhaseCode } from "@prisma/client";

import { PrismaService } from "../prisma.service";

interface LifecyclePhaseSeedRow {
  code: LifecyclePhaseCode;
  name: string;
  order: number;
}

/**
 * 大工程マスタ(lifecycle_phases)の固定18件シード（設計変更書_ライフサイクル管理_SaaS化.md②
 * 「企画〜販売終了の18工程」準拠）。lifecycle_phasesはPR①(7-2)でテーブルのみ追加され、
 * データ投入手段が無かったため、admin CRUD(PR③)実装時に本シーダーを追加した（コード・順序は
 * enum定義そのものであり、初期マスタデータ(工程マスタの期間/費用/書類、要出典レビュー)とは異なり
 * 外部一次資料への出典を要しない構造データのため、migrationではなくアプリ起動時の冪等upsertとする）。
 * 既存行はcode一致でupsertするのみ（name/orderの上書きは行わない設計変更が入った場合、別途migration
 * またはadmin機能で対応する想定、現時点では不要のためYAGNI）。
 */
@Injectable()
export class LifecyclePhaseSeeder implements OnModuleInit {
  private static readonly PHASES: LifecyclePhaseSeedRow[] = [
    { code: "PLANNING", name: "企画", order: 1 },
    { code: "MARKET_RESEARCH", name: "市場調査", order: 2 },
    { code: "DESIGN", name: "設計", order: 3 },
    { code: "RISK_ISO14971", name: "リスクマネジメント（ISO14971）", order: 4 },
    { code: "QMS", name: "QMS構築", order: 5 },
    { code: "TESTING", name: "試験", order: 6 },
    { code: "REG_STRATEGY", name: "薬事戦略", order: 7 },
    { code: "SUBMISSION", name: "承認申請", order: 8 },
    { code: "PMDA_CONSULT", name: "PMDA相談", order: 9 },
    { code: "APPROVAL", name: "承認・認証", order: 10 },
    { code: "REIMBURSEMENT", name: "保険償還", order: 11 },
    { code: "LAUNCH", name: "上市", order: 12 },
    { code: "SALES", name: "販売", order: 13 },
    { code: "CHANGE_CONTROL", name: "変更管理", order: 14 },
    { code: "COMPLAINT", name: "苦情処理", order: 15 },
    { code: "CAPA", name: "CAPA", order: 16 },
    { code: "RECALL", name: "回収", order: 17 },
    { code: "DISCONTINUATION", name: "販売終了", order: 18 },
  ];

  private readonly logger = new Logger(LifecyclePhaseSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    for (const phase of LifecyclePhaseSeeder.PHASES) {
      await this.prisma.lifecyclePhase.upsert({
        where: { code: phase.code },
        update: {},
        create: phase,
      });
    }

    this.logger.log(
      `大工程マスタ(lifecycle_phases) ${LifecyclePhaseSeeder.PHASES.length}件を確認済み。`,
    );
  }
}
