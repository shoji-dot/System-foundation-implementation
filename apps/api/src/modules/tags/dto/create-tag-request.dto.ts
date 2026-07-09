import { createTagRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreateTagRequestDto extends createZodDto(createTagRequestSchema) {}
