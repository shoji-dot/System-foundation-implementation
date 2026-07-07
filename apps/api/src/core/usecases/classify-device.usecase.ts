import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";

import { AI_CHAT_QUOTA_LIMITER } from "../domain/ai-chat-quota-limiter";
import type { AiChatQuotaLimiter } from "../domain/ai-chat-quota-limiter";
import { CHAT_COMPLETION_PROVIDER } from "../domain/chat-completion-provider";
import type {
  ChatCompletionMessage,
  ChatCompletionProvider,
} from "../domain/chat-completion-provider";
import { CLASSIFICATION_SEARCH_REPOSITORY } from "../domain/classification-search.repository";
import type {
  ClassificationSearchCandidate,
  ClassificationSearchRepository,
} from "../domain/classification-search.repository";
import type { ClassificationCandidate } from "../domain/classification-suggestion.entity";
import type { Plan } from "../domain/user.entity";

import { CANDIDATE_SHORTLIST_SIZE, MAX_CANDIDATES_RETURNED } from "./classify-device.constants";

export interface ClassifyDeviceInput {
  userId: string;
  plan: Plan;
  description: string;
}

interface LlmRankedCandidate {
  index: number;
  confidence: number;
  reasoning: string;
}

/**
 * 設計書⑤ POST /api/v1/ai/classify、設計書⑥「分類支援: 機器説明→JMDN/クラス候補提示（検索+LLM再ランク）」。
 * pg_trgmでshortlist（候補母集団）を取得→LLMに確信度・理由付きで再ランクさせる。
 * ユーザー承認済み方針:
 * - 検索はpg_trgmのみ（device_classificationsにembedding列は追加しない）。
 * - 日次AI利用回数は AI_CHAT_QUOTA_LIMITER をchatと共有する（設計書⑥のエンタイトルメント「AI回数」は
 *   機能横断の単一フラグのため）。名前が chat 由来なのは既存実装からの流用であり、実体は
 *   「AI機能全体の日次利用回数」を管理する。
 * - shortlistが0件の場合はchatの「根拠なし回答の禁止」と同じ方針でLLMを呼ばず空配列を返す。
 */
@Injectable()
export class ClassifyDeviceUsecase {
  constructor(
    @Inject(AI_CHAT_QUOTA_LIMITER) private readonly quotaLimiter: AiChatQuotaLimiter,
    @Inject(CLASSIFICATION_SEARCH_REPOSITORY)
    private readonly classificationSearchRepository: ClassificationSearchRepository,
    @Inject(CHAT_COMPLETION_PROVIDER)
    private readonly chatCompletionProvider: ChatCompletionProvider,
  ) {}

  async execute(input: ClassifyDeviceInput): Promise<ClassificationCandidate[]> {
    const quota = await this.quotaLimiter.consume(input.userId, input.plan);
    if (!quota.allowed) {
      throw new HttpException(
        {
          type: "about:blank",
          title: "Too Many Requests",
          status: HttpStatus.TOO_MANY_REQUESTS,
          detail: `無料プランのAI利用回数の上限（${quota.limit}回/日）に達しました。日付が変わるまでお待ちいただくか、プランのアップグレードをご検討ください。`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const shortlist = await this.classificationSearchRepository.searchByDeviceDescription(
      input.description,
      CANDIDATE_SHORTLIST_SIZE,
    );
    if (shortlist.length === 0) {
      return [];
    }

    const messages = this.buildPromptMessages(input.description, shortlist);
    let rawResponse = "";
    await this.chatCompletionProvider.streamComplete(messages, (token) => {
      rawResponse += token;
    });

    const ranked = this.parseLlmResponse(rawResponse, shortlist.length);
    return ranked.slice(0, MAX_CANDIDATES_RETURNED).flatMap((item) => {
      // index は isValidRankedCandidate で [1, shortlist.length] に収まることを検証済みだが、
      // noUncheckedIndexedAccess下ではTSが静的に保証できないため、実行時ガードで安全に扱う。
      const candidate = shortlist[item.index - 1];
      return candidate ? [this.toCandidate(candidate, item)] : [];
    });
  }

  private buildPromptMessages(
    description: string,
    shortlist: ClassificationSearchCandidate[],
  ): ChatCompletionMessage[] {
    const list = shortlist
      .map(
        (candidate, index) =>
          `${index + 1}. [${candidate.scheme}] ${candidate.code} ${candidate.name}（${candidate.jurisdiction.name}, クラス: ${candidate.class ?? "不明"}）\n${candidate.definition ?? ""}`,
      )
      .join("\n\n");

    const systemPrompt = [
      "あなたは医療機器の分類（JMDN等）を支援する専門アシスタントです。",
      "以下の「候補一覧」の中から、機器説明に最も合致するものを確信度の高い順に最大5件選んでください。",
      "候補一覧に無い分類を作り出してはいけません。必ず候補一覧のインデックス番号で回答してください。",
      "出力は以下のJSON形式のみとし、他の文章は一切含めないでください。",
      '{"candidates":[{"index":番号,"confidence":0から1の数値,"reasoning":"選定理由"}]}',
      "",
      "# 候補一覧",
      list,
    ].join("\n");

    return [
      { role: "system", content: systemPrompt },
      { role: "user", content: `機器説明: ${description}` },
    ];
  }

  private parseLlmResponse(rawResponse: string, shortlistSize: number): LlmRankedCandidate[] {
    const jsonText = this.extractJson(rawResponse);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new Error("LLMの分類結果の解析に失敗しました（JSON形式ではありません）。");
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as { candidates?: unknown }).candidates)
    ) {
      throw new Error("LLMの分類結果の解析に失敗しました（candidates配列がありません）。");
    }

    return (parsed as { candidates: unknown[] }).candidates
      .filter((item): item is LlmRankedCandidate =>
        this.isValidRankedCandidate(item, shortlistSize),
      )
      .map((item) => ({ ...item, confidence: Math.min(Math.max(item.confidence, 0), 1) }));
  }

  private isValidRankedCandidate(item: unknown, shortlistSize: number): item is LlmRankedCandidate {
    if (typeof item !== "object" || item === null) {
      return false;
    }
    const candidate = item as Partial<LlmRankedCandidate>;
    return (
      typeof candidate.index === "number" &&
      Number.isInteger(candidate.index) &&
      candidate.index >= 1 &&
      candidate.index <= shortlistSize &&
      typeof candidate.confidence === "number" &&
      typeof candidate.reasoning === "string" &&
      candidate.reasoning.length > 0
    );
  }

  /** LLMがコードフェンス（```json ... ```）で包んで返す場合に備えて中身のみを取り出す。 */
  private extractJson(rawResponse: string): string {
    const trimmed = rawResponse.trim();
    const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
    return fenced ? (fenced[1] ?? trimmed) : trimmed;
  }

  private toCandidate(
    candidate: ClassificationSearchCandidate,
    ranked: LlmRankedCandidate,
  ): ClassificationCandidate {
    return {
      classificationId: candidate.id,
      scheme: candidate.scheme,
      jurisdiction: candidate.jurisdiction,
      code: candidate.code,
      name: candidate.name,
      class: candidate.class,
      definition: candidate.definition,
      confidence: ranked.confidence,
      reasoning: ranked.reasoning,
    };
  }
}
