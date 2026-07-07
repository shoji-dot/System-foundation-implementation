import { z } from "zod";

import { professionSchema } from "./roles";
import { jurisdictionCodeSchema } from "./schemas";

/**
 * PATCH /api/v1/me/onboarding リクエストボディ（設計書⑫ S03「職能・関心国選択」）。
 * 設計書⑤の主要エンドポイント一覧に明記は無いが、S01-S02-S03-S04の画面遷移（設計書⑬）を実現するために
 * 必要なためユーザー承認済みで追加。関心国は最低1か国必須、法域一覧（設計書④ jurisdictions の10コード）の
 * 範囲内から複数選択できる。
 */
export const completeOnboardingRequestSchema = z.object({
  profession: professionSchema,
  interestedJurisdictions: z.array(jurisdictionCodeSchema).min(1).max(10),
});
export type CompleteOnboardingRequest = z.infer<typeof completeOnboardingRequestSchema>;
