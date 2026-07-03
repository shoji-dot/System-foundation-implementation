import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { BadRequestException, Injectable } from "@nestjs/common";
import type { ZodType } from "zod";

interface SchemaBearing {
  schema?: ZodType;
}

/**
 * 設計書⑤: 入力値検証はZodを使用する（class-validator は導入しない）。
 * `createZodDto` で生成したDTOクラス（static schema を持つ）が付いたパラメータのみ検証し、
 * schema を持たない型（string/number等プリミティブ）はそのまま通過させる。
 * main.ts でグローバルパイプとして登録する。
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const schema = (metadata.metatype as SchemaBearing | undefined)?.schema;
    if (!schema) {
      return value;
    }

    const result = schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: result.error.issues.map(
          (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
        ),
      });
    }

    return result.data;
  }
}
