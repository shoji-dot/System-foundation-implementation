import { lessonTagParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class LessonTagParamDto extends createZodDto(lessonTagParamSchema) {}
