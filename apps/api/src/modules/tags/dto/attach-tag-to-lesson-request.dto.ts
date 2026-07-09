import { attachTagToLessonRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class AttachTagToLessonRequestDto extends createZodDto(attachTagToLessonRequestSchema) {}
