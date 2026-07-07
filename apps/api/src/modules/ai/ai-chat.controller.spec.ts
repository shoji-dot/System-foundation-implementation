import { HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";

import type { AuthenticatedRequest } from "../../common/guards/authenticated-request";
import type { ChatWithAiEvent } from "../../core/usecases/chat-with-ai.usecase";
import { ChatWithAiUsecase } from "../../core/usecases/chat-with-ai.usecase";

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

  function createController(execute: jest.Mock) {
    const usecase = { execute } as unknown as ChatWithAiUsecase;
    return new AiChatController(usecase);
  }

  it("streams citations/token/done as SSE frames and ends the response", async () => {
    const execute = jest.fn(
      async (_input: unknown, onEvent: (event: ChatWithAiEvent) => void) => {
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
      },
    );
    const controller = createController(execute);
    const res = createMockResponse();

    await controller.chat({ message: "質問" }, request, res);

    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(res.flushHeaders).toHaveBeenCalledTimes(1);

    const writtenFrames = res.write.mock.calls.map((call) => call[0] as string);
    expect(writtenFrames[0]).toContain("event: citations");
    expect(writtenFrames[0]).toContain("第23条の2");
    expect(writtenFrames[1]).toBe(`event: token\ndata: ${JSON.stringify({ token: "回答です" })}\n\n`);
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
    const execute = jest.fn(
      async (_input: unknown, onEvent: (event: ChatWithAiEvent) => void) => {
        onEvent({ type: "citations", citations: [] });
        throw new Error("OpenAI API failure");
      },
    );
    const controller = createController(execute);
    const res = createMockResponse();

    await controller.chat({ message: "質問" }, request, res);

    const writtenFrames = res.write.mock.calls.map((call) => call[0] as string);
    expect(writtenFrames[writtenFrames.length - 1]).toContain("event: error");
    expect(res.end).toHaveBeenCalledTimes(1);
  });
});
