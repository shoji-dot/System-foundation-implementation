import { updateLessonRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateLessonRequestDto extends createZodDto(updateLessonRequestSchema) {}
