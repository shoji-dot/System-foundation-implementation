import { courseIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CourseIdParamDto extends createZodDto(courseIdParamSchema) {}
