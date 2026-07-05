import { lessonIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class LessonIdParamDto extends createZodDto(lessonIdParamSchema) {}
