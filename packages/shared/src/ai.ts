/**
 * AIチャットメッセージの発言者ロール（設計書④ ai_chat_messages 準拠）。apps/api の AiChatMessageRole と値を一致させる。
 */
export const AI_CHAT_MESSAGE_ROLES = ["USER", "ASSISTANT"] as const;
export type AiChatMessageRole = (typeof AI_CHAT_MESSAGE_ROLES)[number];
