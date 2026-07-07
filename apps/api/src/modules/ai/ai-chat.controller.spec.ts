import { HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import type { ChatWithAiEvent } from "../../core/usecases/chat-with-ai.usecase";
import { ChatWithAiUsecase } from "../../core/usecases/chat-with-ai.usecase";
import { ClassifyDeviceUsecase } from "../../core/usecases/classify-device.usecase";
import { ListAiChatMessagesUsecase } from "../../core/usecases/list-ai-chat-messages.usecase";
import { ListAiChatSessionsUsecase } from "../../core/usecases/list-ai-chat-sessions.usecase";

import { AiChatController } from "./ai-chat.controller";

describe("AiChatController", () => {
  const request = {
    user: { userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b", plan: "FREE" },
  } as unknown as AuthenticatedRequest;

  function createMockResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Response>;
  }

  function createController(
    execute: jest.Mock,
    classifyExecute: jest.Mock = jest.fn(),
    listSessionsExecute: jest.Mock = jest.fn(),
    listMessagesExecute: jest.Mock = jest.fn(),
  ) {
    const chatWithAiUsecase = { execute } as unknown as ChatWithAiUsecase;
    const classifyDeviceUsecase = { execute: classifyExecute } as unknown as ClassifyDeviceUsecase;
    const listAiChatSessionsUsecase = {
      execute: listSessionsExecute,
    } as unknown as ListAiChatSessionsUsecase;
    const listAiChatMessagesUsecase = {
      execute: listMessagesExecute,
    } as unknown as ListAiChatMessagesUsecase;
    return new AiChatController(
      chatWithAiUsecase,
      classifyDeviceUsecase,
      listAiChatSessionsUsecase,
      listAiChatMessagesUsecase,
    );
  }

  it("streams citations/token/done as SSE frames and ends the response", async () => {
    const execute = jest.fn(async (_input: unknown, onEvent: (event: ChatWithAiEvent) => void) => {
      onEvent({
        type: "citations",
        citations: [
          {
            sectionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
            regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5e",
            regulationTitle: "医薬品医療機器等法",
            jurisdiction: { code: "JP", name: "日本" },
            versionNo: 1,
            effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
            effectiveTo: null,
            path: "第23条の2",
            heading: "製造販売業の許可",
          },
        ],
      });
      onEvent({ type: "token", token: "回答です" });
      onEvent({ type: "done", sessionId: "sess-1", messageId: "msg-1" });
    });
    const controller = createController(execute);
    const res = createMockResponse();

    await controller.chat({ message: "質問" }, request, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(res.flushHeaders).toHaveBeenCalledTimes(1);

    const writtenFrames = res.write.mock.calls.map((call) => call[0] as string);
    expect(writtenFrames[0]).toContain("event: citations");
    expect(writtenFrames[0]).toContain("第23条の2");
    expect(writtenFrames[1]).toBe(
      `event: token\ndata: ${JSON.stringify({ token: "回答です" })}\n\n`,
    );
    expect(writtenFrames[2]).toBe(
      `event: done\ndata: ${JSON.stringify({ sessionId: "sess-1", messageId: "msg-1" })}\n\n`,
    );
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it("rethrows (without writing SSE headers) when the usecase fails before emitting any event", async () => {
    const quotaError = new HttpException(
      { type: "about:blank", title: "Too Many Requests", status: 429, detail: "上限到達" },
      HttpStatus.TOO_MANY_REQUESTS,
    );
    const execute = jest.fn().mockRejectedValue(quotaError);
    const controller = createController(execute);
    const res = createMockResponse();

    await expect(controller.chat({ message: "質問" }, request, res)).rejects.toBe(quotaError);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(res.flushHeaders).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
  });

  it("emits an SSE error event (instead of rethrowing) when the usecase fails after streaming started", async () => {
    const execute = jest.fn(async (_input: unknown, onEvent: (event: ChatWithAiEvent) => void) => {
      onEvent({ type: "citations", citations: [] });
      throw new Error("OpenAI API failure");
    });
    const controller = createController(execute);
    const res = createMockResponse();

    await controller.chat({ message: "質問" }, request, res);

    const writtenFrames = res.write.mock.calls.map((call) => call[0] as string);
    expect(writtenFrames[writtenFrames.length - 1]).toContain("event: error");
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it("returns classification candidates as plain JSON (no SSE) from the classify usecase", async () => {
    const classifyExecute = jest.fn().mockResolvedValue([
      {
        classificationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e01",
        scheme: "JMDN",
        jurisdiction: { code: "JP", name: "日本" },
        code: "35282000",
        name: "汎用電子内視鏡",
        class: "III",
        definition: "体腔内を観察するための電子内視鏡。",
        confidence: 0.9,
        reasoning: "説明と一致する。",
      },
    ]);
    const controller = createController(jest.fn(), classifyExecute);

    const result = await controller.classify({ description: "内視鏡です" }, request);

    expect(classifyExecute).toHaveBeenCalledWith({
      userId: request.user.userId,
      plan: request.user.plan,
      description: "内視鏡です",
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({ code: "35282000", confidence: 0.9 });
  });

  it("lists the requesting user's chat sessions with ISO-formatted timestamps", async () => {
    const listSessionsExecute = jest.fn().mockResolvedValue({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
          title: "製造販売業の許可について",
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
          updatedAt: new Date("2026-07-07T00:10:00.000Z"),
        },
      ],
      nextCursor: null,
    });
    const controller = createController(jest.fn(), jest.fn(), listSessionsExecute);

    const result = await controller.listSessions(request, { cursor: undefined, limit: 20 });

    expect(listSessionsExecute).toHaveBeenCalledWith({
      userId: request.user.userId,
      cursor: undefined,
      limit: 20,
    });
    expect(result.items[0]).toMatchObject({
      id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      createdAt: "2026-07-07T00:00:00.000Z",
      updatedAt: "2026-07-07T00:10:00.000Z",
    });
  });

  it("lists messages for a session, mapping citations through the response schema", async () => {
    const listMessagesExecute = jest.fn().mockResolvedValue({
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5f",
          role: "ASSISTANT",
          content: "回答本文",
          citations: [
            {
              sectionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5d",
              regulationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5e",
              regulationTitle: "医薬品医療機器等法",
              jurisdiction: { code: "JP", name: "日本" },
              versionNo: 1,
              effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
              effectiveTo: null,
              path: "第23条の2",
              heading: "製造販売業の許可",
            },
          ],
          createdAt: new Date("2026-07-07T00:10:00.000Z"),
        },
      ],
      nextCursor: null,
    });
    const controller = createController(jest.fn(), jest.fn(), jest.fn(), listMessagesExecute);

    const result = await controller.listMessages(
      request,
      { id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" },
      { cursor: undefined, limit: 20 },
    );

    expect(listMessagesExecute).toHaveBeenCalledWith({
      userId: request.user.userId,
      sessionId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      cursor: undefined,
      limit: 20,
    });
    expect(result.items[0]).toMatchObject({
      role: "ASSISTANT",
      content: "回答本文",
      citations: [expect.objectContaining({ path: "第23条の2", effectiveFrom: "2026-01-01" })],
    });
  });
});
