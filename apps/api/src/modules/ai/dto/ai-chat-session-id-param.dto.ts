import { aiChatSessionIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class AiChatSessionIdParamDto extends createZodDto(aiChatSessionIdParamSchema) {}
