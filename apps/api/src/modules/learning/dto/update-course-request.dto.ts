import { updateCourseRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateCourseRequestDto extends createZodDto(updateCourseRequestSchema) {}
