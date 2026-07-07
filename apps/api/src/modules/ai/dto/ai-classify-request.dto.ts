import { aiClassifyRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class AiClassifyRequestDto extends createZodDto(aiClassifyRequestSchema) {}
