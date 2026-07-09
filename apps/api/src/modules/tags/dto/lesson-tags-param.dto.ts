import { lessonTagsParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class LessonTagsParamDto extends createZodDto(lessonTagsParamSchema) {}
