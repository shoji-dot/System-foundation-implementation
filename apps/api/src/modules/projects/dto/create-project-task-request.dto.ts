import { createProjectTaskRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreateProjectTaskRequestDto extends createZodDto(createProjectTaskRequestSchema) {}
