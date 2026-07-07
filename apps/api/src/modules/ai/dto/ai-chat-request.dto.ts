import { aiChatRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class AiChatRequestDto extends createZodDto(aiChatRequestSchema) {}
