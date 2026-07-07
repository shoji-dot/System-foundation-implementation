/** pg_trgm検索でLLMに渡すshortlistの件数（LLM再ランク前の候補母集団）。 */
export const CANDIDATE_SHORTLIST_SIZE = 20;

/** LLM再ランク後に返す最終候補の最大数（設計書⑥「候補提示」）。 */
export const MAX_CANDIDATES_RETURNED = 5;
