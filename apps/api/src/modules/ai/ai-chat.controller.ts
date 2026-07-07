import { Body, Controller, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { AiChatCitationResponse } from "@yakuji/shared";
import { aiChatCitationResponseSchema } from "@yakuji/shared";
import type { Response } from "express";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import type { AiChatCitation } from "../../core/domain/ai-chat.entity";
import type { ChatWithAiEvent } from "../../core/usecases/chat-with-ai.usecase";
import { ChatWithAiUsecase } from "../../core/usecases/chat-with-ai.usecase";

import { AiChatRequestDto } from "./dto/ai-chat-request.dto";

/**
 * 設計書⑤ POST /api/v1/ai/chat（SSEストリーミング、RAG回答＋出典、S14）。
 * ヘッダ送信前（=最初のonEventが呼ばれる前）に例外が投げられた場合は、SSEを開始せず
 * Nestの標準例外フィルタ（RFC 9457）に委譲する（quota超過・sessionId不正等）。
 * ヘッダ送信後の失敗はSSE上のerrorイベントとして通知するしかない（HTTPステータスは変更不可のため）。
 */
@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly chatWithAiUsecase: ChatWithAiUsecase) {}

  @Post("chat")
  async chat(
    @Body() dto: AiChatRequestDto,
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    let headersSent = false;

    const writeEvent = (event: string, data: unknown): void => {
      if (!headersSent) {
        res.status(HttpStatus.OK);
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();
        headersSent = true;
      }
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.chatWithAiUsecase.execute(
        {
          userId: request.user.userId,
          plan: request.user.plan,
          sessionId: dto.sessionId,
          message: dto.message,
        },
        (event: ChatWithAiEvent) => {
          if (event.type === "citations") {
            writeEvent("citations", {
              citations: event.citations.map((citation) => toCitationResponse(citation)),
            });
          } else if (event.type === "token") {
            writeEvent("token", { token: event.token });
          } else {
            writeEvent("done", { sessionId: event.sessionId, messageId: event.messageId });
          }
        },
      );
    } catch (error) {
      if (headersSent) {
        writeEvent("error", {
          title: "Internal Server Error",
          detail: "回答の生成中にエラーが発生しました。",
        });
        res.end();
        return;
      }
      throw error;
    }

    res.end();
  }
}

function toCitationResponse(citation: AiChatCitation): AiChatCitationResponse {
  return aiChatCitationResponseSchema.parse({
    sectionId: citation.sectionId,
    regulationId: citation.regulationId,
    regulationTitle: citation.regulationTitle,
    jurisdiction: citation.jurisdiction,
    versionNo: citation.versionNo,
    effectiveFrom: toDateOnlyString(citation.effectiveFrom),
    effectiveTo: toDateOnlyString(citation.effectiveTo),
    path: citation.path,
    heading: citation.heading,
  });
}
