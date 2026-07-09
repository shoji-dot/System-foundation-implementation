import { updateTagRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateTagRequestDto extends createZodDto(updateTagRequestSchema) {}
