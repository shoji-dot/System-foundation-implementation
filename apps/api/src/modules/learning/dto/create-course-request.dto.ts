import { createCourseRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreateCourseRequestDto extends createZodDto(createCourseRequestSchema) {}
