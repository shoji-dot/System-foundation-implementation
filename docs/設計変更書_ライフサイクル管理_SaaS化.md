# 設計変更書: 医療機器ライフサイクル管理 + SaaS収益化

- 版: v1.0 (2026-07-09) / 状態: **承認済み（2026-07-09）**
- 対象: システム全体設計書 v1（全体設計書④⑤⑥⑫⑮を改版済み。7-1より実装着手）

---

## 0. 変更理由・影響範囲・代替案

**理由**: 現行（develop, 機能面~95%完了）は「調べる・学ぶ・聞く」中心で、企業が年間契約する決定的価値=「申請業務そのものの時間短縮」が S15/S16 の汎用チェックリスト止まり。クラス/種別を選ぶだけで企画→販売終了までの工程・期間・費用・書類・試験・通知が出る「ライフサイクル管理」を有料版の中核に据え、Stripe課金とCapacitorによるiOS配信で商用化する。

**影響範囲**: DB追加5テーブル+既存2テーブル列追加（破壊的変更なし）、APIモジュール2追加（lifecycle, billing）、画面4追加+2改修、entitlement定義拡張。既存アーキテクチャ（Clean Architecture / Repository / BullMQ / RAG）は不変。

**代替案と採否**:

| 案                       | 採否 | 理由                                                                         |
| ------------------------ | ---- | ---------------------------------------------------------------------------- |
| ロードマップを完全AI生成 | 却下 | 根拠・再現性・監査性が担保できず設計書AI原則（根拠必須）と矛盾               |
| マスタのみ（AIなし）     | 却下 | 差別化不足。AI補完は工程の個別調整・解説に限定して採用                       |
| React Native別開発       | 却下 | フロント二重管理。PWA+Capacitorでコード共有100%                              |
| IAP併用課金              | 保留 | B2B中心の初期はStripeのみ。App Store審査でreader app扱い可否を確認後に再検討 |

**メリット**: 有料版の契約理由が明確化（工数削減の定量価値）、既存 projects/checklists 基盤の再利用で実装量最小、マスタ方式で根拠提示・監査対応可能。
**デメリット**: 工程マスタの初期整備（JP: 届出/認証/承認 × クラスI–IV × SaMD/IVD/能動）に薬事知識の人手投入が必要。費用・期間は「概算レンジ+根拠出典」としても保守が必要 → admin画面(S22)で運用でカバー。

---

## ① 画面追加案

| #    | 画面                       | 概要                                                                                                                 | プラン                   |
| ---- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| S23  | ライフサイクル・ウィザード | 機器種別(クラスI–IV/SaMD/IVD/能動/その他)・申請区分・対象国を選択→ロードマップ生成                                   | Free=閲覧のみ, Pro+=保存 |
| S24  | ロードマップビュー         | 企画→販売終了の全工程をタイムライン/ガント表示。各工程に期間・概算費用・必要書類・必要試験・関連通知・PMDA資料リンク | Pro+                     |
| S25  | 工程詳細                   | 工程の詳細、根拠（通知/ガイダンス→S07リンク）、AI解説・個別調整チャット                                              | Pro+                     |
| S26  | 組織ダッシュボード         | 組織内全プロジェクトの工程進捗・期限・担当の横断ビュー                                                               | Business+                |
| S27  | プラン/請求                | Stripe Customer Portal 連携（プラン変更・請求書・支払方法）                                                          | 全員                     |
| 改修 | S16                        | プロジェクト詳細にロードマップタブ追加（既存タスクと工程を紐付け）                                                   | —                        |
| 改修 | S19                        | プラン表示→S27へ導線                                                                                                 | —                        |
| 追加 | S22(admin)                 | 工程マスタ管理（テンプレート/期間/費用/書類/根拠の校閲・公開）                                                       | admin/editor             |

遷移: S15→S23（新規作成）→S24→S25（→S07/S14）。S04にロードマップ進捗ウィジェット追加。

## ② DB変更（全て追加、既存互換維持・Migration管理）

```prisma
// 工程マスタ（editorが校閲・公開。regulation同様に versioning）
LifecyclePhase        // 大工程マスタ: code(planning/market_research/design/risk_iso14971/qms/testing/reg_strategy/submission/pmda_consult/approval/reimbursement/launch/sales/change_control/complaint/capa/recall/discontinuation), name, order
LifecycleTemplate     // id, jurisdictionId, framework(enum: MEDICAL_DEVICE/IVD/COMBINATION_PRODUCT),
                      // deviceClass(enum: CLASS_I..IV/OTHER、nullable)、productNovelty(enum: NEW/MODIFIED/GENERIC、
                      // nullable)、approvalRoute(届出/認証/承認/510k/CE…、自由文字列)、status(draft/published)、
                      // version、effectiveFrom(date)、effectiveTo(date、nullable)
                      // ※2026-07-10改訂（末尾「変更履歴」参照）: 旧deviceCategory単一enumをframework/
                      //   deviceClass/productNoveltyの3軸に分離。SaMD/能動植込み等の「特性」は本テーブルの列
                      //   ではなく既存tags/taggings（TaggableType.LIFECYCLE_TEMPLATE追加）で表現する。
LifecycleTemplateStep // templateId, phaseId, name, order, durationMinDays/MaxDays, costMinJpy/MaxJpy, requiredDocuments jsonb, requiredTests jsonb, relatedRegulationIds uuid[], pmdaResourceUrls jsonb, notes, sourceRefs jsonb（根拠必須）
ProjectRoadmap        // projectId(1:1拡張), templateId, generatedAt, aiAdjustments jsonb, status
ProjectRoadmapStep    // roadmapId, templateStepId, status, plannedStart/End, actualStart/End, assigneeId, customFields jsonb
// 課金
Subscription          // orgId or userId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd, seats
// 既存変更
users.plan            // 既存enumを FREE/PRO/BUSINESS/ENTERPRISE に拡張（既存FREE互換）
user_projects         // +deviceCategory, +procedureType（nullable追加のみ）
tags/taggings.TaggableType // +LIFECYCLE_TEMPLATE（2026-07-10改訂、工程マスタの特性タグ用に追加）
```

分類は既存 `device_classifications` を流用し新スキーム追加はしない。工程マスタは regulation と同じ「不変版管理+status」原則。

## ③ API追加（/api/v1、既存規約: cursor pagination / RFC9457 / Zod / Repository+DI）

```
GET  /lifecycle/templates?jurisdiction=&framework=&deviceClass=&approvalRoute=   # マスタ一覧(Free可、2026-07-10改訂で軸を分離)
GET  /lifecycle/templates/:id                                            # 工程詳細(Free=概要のみ)
POST /projects/:id/roadmap          # 生成（テンプレ適用+AI補完）Pro+
GET  /projects/:id/roadmap
PATCH /projects/:id/roadmap/steps/:stepId    # 進捗・期日・担当更新
POST /projects/:id/roadmap/steps/:stepId/ai-advise   # 工程別AI相談(SSE, 出典付き) Pro+
GET  /orgs/:id/roadmaps             # 組織横断ビュー Business+
# billing
POST /billing/checkout              # Stripe Checkout Session
POST /billing/portal                # Customer Portal Session
POST /billing/webhook               # Stripe Webhook（署名検証、plan/Subscription同期）
# admin
CRUD /admin/lifecycle-templates     # editor/admin、S20と同じdraft→publishフロー
```

エンタイトルメントは既存 plan-entitlements ドメイン層に `roadmap.create`, `roadmap.aiAdvise`, `org.dashboard` 等の権限キーを追加するのみ。

## ④ AI設計（マスタ+AI補完方式）

1. **生成**: テンプレートstepをベースに、プロジェクトの機器概要を入力し LLM が「工程の個別注意事項・スキップ可否・追加推奨工程」を提案（aiAdjustments として保存、マスタ値は改変しない）。
2. **根拠**: 期間・費用・書類・試験はマスタ値（sourceRefs 必須）をそのまま表示。AI出力は必ず regulation_sections への出典付き（既存RAGパイプライン流用）、根拠なしは既存の回答拒否テンプレート適用。
3. **出力項目**: 次にやるべきこと / 必要書類 / 必要試験 / 想定期間 / 概算費用 / 関連通知 / 注意事項（設計書AI原則⑥をロードマップ文脈で実装）。
4. **免責**: 費用・期間は「概算レンジ・参考値」の定型免責を全画面に表示。
5. **コスト制御**: 既存の回答キャッシュ+plan別日次制限を ai-advise にも適用。

## ⑤ UI変更（デザインシステム⑭は不変）

- 新コンポーネント: `Timeline/GanttView`（工程バー、44pxタップ）、`PhaseCard`（期間/費用レンジ+根拠CitationChip）、`PlanBadge`/`UpgradePrompt`（Free利用者への非侵襲なアップセル、1画面1主操作の原則を維持）。
- グローバルナビは5項目固定を維持（ロードマップは「プロジェクト」配下）。
- Free制限時はぼかし+アップグレード導線（データ自体は返さない。フロント制御のみの出し分け禁止）。

## ⑥ プラン分離

| 機能                         | Free             | Pro (月/年)    | Business        | Enterprise    |
| ---------------------------- | ---------------- | -------------- | --------------- | ------------- |
| 法令検索・JMDN・更新フィード | ○                | ○              | ○               | ○             |
| 学習コース                   | 基礎のみ         | ○              | ○               | ○             |
| AIチャット                   | 5回/日           | 50回/日        | 200回/日/席     | 無制限+専用枠 |
| ロードマップ                 | テンプレ閲覧のみ | 生成・保存 3件 | 無制限+組織共有 | 無制限        |
| 工程別AI相談                 | ×                | ○              | ○               | ○             |
| 組織ダッシュボード(S26)      | ×                | ×              | ○               | ○             |
| メンバー管理・権限           | ×                | ×              | ○(席課金)       | ○             |
| 監査ログ閲覧・エクスポート   | ×                | ×              | ○               | ○             |
| SSO(SAML)・API提供・SLA      | ×                | ×              | ×               | ○(請求書払い) |

Freeは営業担当の日常ツール（検索・分類・更新フィード・基礎学習）として完結させ、「業務時間短縮」機能（ロードマップ/AI相談/組織管理）を有料に集約。

**社内利用（無償フル機能）**: 自社を含む特定組織に Stripe を通さず全機能を付与するため、`Subscription.source = stripe | complimentary` を設け、admin が組織へ complimentary プラン（実質Enterprise相当）を手動付与できるようにする。7-1で実装（社内ドッグフーディングの前提条件）。

## ⑦ リリースまでのロードマップ

| Phase            | 期間目安 | 範囲                                                                             | 完了基準                                     |
| ---------------- | -------- | -------------------------------------------------------------------------------- | -------------------------------------------- |
| 7-1 課金基盤     | 2週      | Stripe Checkout/Portal/Webhook, Subscription同期, S27, plan enum拡張             | テスト環境で4プラン切替が entitlement に反映 |
| 7-2 工程マスタ   | 3週      | DB5テーブル+S22 admin、JP承認/認証/届出×主要カテゴリの初期マスタ投入（根拠付き） | published テンプレ 8本以上                   |
| 7-3 ロードマップ | 3週      | S23–S25、生成/進捗API、S16統合、AI補完                                           | ウィザード→生成→進捗管理がE2Eで通る          |
| 7-4 組織機能     | 2週      | S26、席管理、Business向け招待フロー                                              | 複数席で組織横断ビュー動作                   |
| 7-5 iOS          | 2週      | Capacitorラップ、アイコン/スプラッシュ、App Store審査（外部課金導線の審査対応）  | TestFlight配布→審査提出                      |
| 7-6 商用化残件   | 1週      | k6実測、OpenAI本番課金、法務プレースホルダ+弁護士レビュー、料金ページ(S01改修)   | 本番課金開始可能                             |

計約13週。品質ゲートは既存（strict 0 / lint 0 / unit+E2E / Lighthouse 90+）を継続。

---

_2026-07-09 承認。全体設計書④⑤⑥⑫⑮改版済み。7-1 (課金基盤) を feature/lifecycle-saas-plan-billing-foundation で着手（Plan enum拡張+Subscriptionテーブルから）。_

## 変更履歴: 2026-07-10 工程マスタ タクソノミー再設計（ユーザー承認済み）

**理由**: 7-2の初期マスタデータ草案（JP主要カテゴリ×届出/認証/承認）をレビューした結果、`LifecycleTemplate.deviceCategory`という単一enum（CLASS_I..IV, SAMD, IVD, ACTIVE, OTHER）に「Class」「新規性区分（新医療機器/改良/後発）」「SaMD/能動植込み等の特性」という異なる3つの軸が混在しており、同じClassでも新規性区分によって審査期間・手数料・必要書類が大きく変わる実態を表現できないと判明。SaMD/能動植込みは本来「Classとは直交する特性」であり、独立カテゴリとして固定enum化すると将来の特性追加（滅菌済・AI搭載等）のたびにスキーマ変更が必要になる。

**影響範囲**: `schema.prisma`（LifecycleTemplateの列再設計、TaggableType追加、migration追加）、`packages/shared/src/lifecycle.ts`（Zod schema・ラベル定義）、admin CRUD API（entity/repository/usecase/DTO/controller、計10ファイル程度）、S22管理画面3画面（フォーム・一覧・詳細、計5ファイル程度）。7-2はテンプレート未投入・main未反映の段階だったため、後方互換コストが最小のタイミングで実施。

**代替案と採否**:

| 案                                                                         | 採否     | 理由                                                                                                                                 |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 現状維持（8テンプレートをそのまま運用開始）                                | 却下     | Class内の新規性差を表現できず、料金・期間が粗い近似になる                                                                            |
| procedureTypeの自由文字列に新規性区分を混在させる                          | 却下     | 「手続き区分」と「新規性区分」という別概念が1列に混ざり、将来の検索・フィルタが濁る                                                  |
| 軸を分離（framework/deviceClass/productNovelty + tags/taggingsで特性表現） | **採用** | 実態に最も近い。FDA/EU MDR等の将来拡張時も同じ軸（Framework→ApprovalRoute→ProductNovelty→DeviceClass→Characteristics）を再利用できる |

**新データモデル**:

- `LifecycleFramework`（MEDICAL_DEVICE/IVD/COMBINATION_PRODUCT）: 法体系区分。IVDは医療機器のClass I-IVとは別の分類体系のため独立させる。
- `LifecycleDeviceClass`（CLASS_I..IV/OTHER、nullable）: framework=MEDICAL_DEVICE以外や届出等では意味を持たないためnullable。
- `LifecycleProductNovelty`（NEW/MODIFIED/GENERIC、nullable）: 新医療機器/改良医療機器/後発医療機器。概念が当てはまらない手続き（届出等）ではnull。
- `approvalRoute`（旧procedureType）: 届出/認証/承認等、自由文字列のまま維持（旧名称が「新規性区分」と紛らわしいため改称のみ）。
- `characteristics`: SaMD/能動植込み等の特性はenum化せず、既存tags/taggings（`TaggableType.LIFECYCLE_TEMPLATE`追加）で表現。将来「滅菌済」「AI搭載」等が増えてもスキーマ変更不要。
- `effectiveFrom`/`effectiveTo`: 「この期間・費用データが妥当と確認できた実世界の期間」の監査用（PMDA手数料改定の追跡が目的。version/statusによるpublishライフサイクル管理とは独立した概念で、regulation_versionsと同型）。

**メリット**: 実態に即した正確なテンプレート表現、FDA/EU MDR等の将来拡張時に同じ軸を再利用可能、特性のenum固定化を避けたことによる保守性向上。
**デメリット**: 7-2のスケジュールが数日延び、admin入力フォームの項目が増える（framework/deviceClass/productNovelty/characteristics/effectiveFrom/effectiveToが追加）。

_2026-07-10 承認・実装完了。次回: 初期マスタデータ草案（docs/ドラフト_工程マスタ初期データ_JP.md）を新データモデルに合わせて改訂 → JSON化・API投入 → 7-2完了。_
