import { createLessonRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreateLessonRequestDto extends createZodDto(createLessonRequestSchema) {}
