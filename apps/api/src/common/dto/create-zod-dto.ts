import type { ZodType, z } from "zod";

/**
 * Zodスキーマから NestJS の DTO クラスを生成する（設計書⑤: 入力値検証はZodを使用）。
 * `ZodValidationPipe` はここで付与した static schema をリフレクションで参照する。
 */
export interface ZodDto<T extends ZodType> {
  new (): z.infer<T>;
  schema: T;
}

export function createZodDto<T extends ZodType>(schema: T): ZodDto<T> {
  class AugmentedZodDto {
    public static readonly schema = schema;
  }

  return AugmentedZodDto as unknown as ZodDto<T>;
}
