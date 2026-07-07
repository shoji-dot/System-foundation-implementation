import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * RFC 9457 (Problem Details for HTTP APIs) 準拠のグローバル例外フィルタ。
 * 設計書 ⑤ API構成: 「RFC 9457 Problem Details エラー」に対応。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const detail =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] })?.message ??
          "Internal server error");

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response
      .status(status)
      .contentType("application/problem+json")
      .send({
        type: "about:blank",
        title: HttpStatus[status] ?? "Error",
        status,
        detail: Array.isArray(detail) ? detail.join(", ") : detail,
        instance: request.url,
      });
  }
}
