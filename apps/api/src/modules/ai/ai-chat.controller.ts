import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type {
  AiChatCitationResponse,
  AiChatMessageListResponse,
  AiChatSessionListResponse,
  AiClassifyResponse,
} from "@yakuji/shared";
import {
  aiChatCitationResponseSchema,
  aiChatMessageListResponseSchema,
  aiChatSessionListResponseSchema,
  aiClassifyResponseSchema,
} from "@yakuji/shared";
import type { Response } from "express";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { toDateOnlyString } from "../../common/utils/date-only";
import type { AiChatCitation, AiChatMessage } from "../../core/domain/ai-chat.entity";
import type { ChatWithAiEvent } from "../../core/usecases/chat-with-ai.usecase";
import { ChatWithAiUsecase } from "../../core/usecases/chat-with-ai.usecase";
import { ClassifyDeviceUsecase } from "../../core/usecases/classify-device.usecase";
import { ListAiChatMessagesUsecase } from "../../core/usecases/list-ai-chat-messages.usecase";
import { ListAiChatSessionsUsecase } from "../../core/usecases/list-ai-chat-sessions.usecase";

import { AiChatRequestDto } from "./dto/ai-chat-request.dto";
import { AiChatSessionIdParamDto } from "./dto/ai-chat-session-id-param.dto";
import { AiClassifyRequestDto } from "./dto/ai-classify-request.dto";
import { ListAiChatMessagesQueryDto } from "./dto/list-ai-chat-messages-query.dto";
import { ListAiChatSessionsQueryDto } from "./dto/list-ai-chat-sessions-query.dto";

/**
 * 設計書⑤ POST /api/v1/ai/{chat|classify}（設計書⑥「AI機能構成」の2機能をまとめて公開する）。
 * chat: SSEストリーミング、RAG回答＋出典（S14）。
 * ヘッダ送信前（=最初のonEventが呼ばれる前）に例外が投げられた場合は、SSEを開始せず
 * Nestの標準例外フィルタ（RFC 9457）に委譲する（quota超過・sessionId不正等）。
 * ヘッダ送信後の失敗はSSE上のerrorイベントとして通知するしかない（HTTPステータスは変更不可のため）。
 * classify: 通常のJSONレスポンス（SSE不要、設計書⑤のエンドポイント一覧でchatのみSSEと明記）。
 * GET chat/sessions・GET chat/sessions/:id/messages: 設計書⑤に明記は無いがS14「履歴」表示に
 * 必要なためユーザー承認済みで追加。
 */
@Controller("ai")
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(
    private readonly chatWithAiUsecase: ChatWithAiUsecase,
    private readonly classifyDeviceUsecase: ClassifyDeviceUsecase,
    private readonly listAiChatSessionsUsecase: ListAiChatSessionsUsecase,
    private readonly listAiChatMessagesUsecase: ListAiChatMessagesUsecase,
  ) {}

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

  @Post("classify")
  @HttpCode(HttpStatus.OK)
  async classify(
    @Body() dto: AiClassifyRequestDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<AiClassifyResponse> {
    const candidates = await this.classifyDeviceUsecase.execute({
      userId: request.user.userId,
      plan: request.user.plan,
      description: dto.description,
    });

    return aiClassifyResponseSchema.parse({ candidates });
  }

  @Get("chat/sessions")
  async listSessions(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListAiChatSessionsQueryDto,
  ): Promise<AiChatSessionListResponse> {
    const result = await this.listAiChatSessionsUsecase.execute({
      userId: request.user.userId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return aiChatSessionListResponseSchema.parse({
      items: result.items.map((session) => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    });
  }

  @Get("chat/sessions/:id/messages")
  async listMessages(
    @Req() request: AuthenticatedRequest,
    @Param() params: AiChatSessionIdParamDto,
    @Query() query: ListAiChatMessagesQueryDto,
  ): Promise<AiChatMessageListResponse> {
    const result = await this.listAiChatMessagesUsecase.execute({
      userId: request.user.userId,
      sessionId: params.id,
      cursor: query.cursor,
      limit: query.limit,
    });

    return aiChatMessageListResponseSchema.parse({
      items: result.items.map((message) => toMessageResponse(message)),
      nextCursor: result.nextCursor,
    });
  }
}

function toMessageResponse(message: AiChatMessage) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    citations: message.citations?.map((citation) => toCitationResponse(citation)) ?? null,
    createdAt: message.createdAt.toISOString(),
  };
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
