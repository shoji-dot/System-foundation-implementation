import { Injectable } from "@nestjs/common";

import type { EmbeddingProvider } from "../../../core/domain/embedding-provider";

interface OpenAiEmbeddingsResponse {
  data: { embedding: number[] }[];
}

/**
 * OpenAI Embeddings APIによるEmbeddingProvider実装（設計書③ infrastructure/external/llm）。
 * モデルはtext-embedding-3-small（1536次元、Prisma schemaのregulation_sections.embedding
 * vector(1536)と一致、ユーザー承認済みでOpenAI一本の構成を採用）。
 */
@Injectable()
export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536;

  private static readonly API_URL = "https://api.openai.com/v1/embeddings";
  private static readonly MODEL = "text-embedding-3-small";

  async embed(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY が設定されていません。");
    }

    const response = await fetch(OpenAiEmbeddingProvider.API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: OpenAiEmbeddingProvider.MODEL, input: text }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `OpenAI Embeddings APIの呼び出しに失敗しました（status: ${response.status}）: ${body}`,
      );
    }

    const json = (await response.json()) as OpenAiEmbeddingsResponse;
    const embedding = json.data[0]?.embedding;
    if (!embedding) {
      throw new Error("OpenAI Embeddings APIの応答にembeddingが含まれていません。");
    }

    return embedding;
  }
}
