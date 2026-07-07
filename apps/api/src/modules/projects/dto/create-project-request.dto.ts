import { createProjectRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreateProjectRequestDto extends createZodDto(createProjectRequestSchema) {}
