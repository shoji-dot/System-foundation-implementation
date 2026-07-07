import { cursorPaginationQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListAiChatSessionsQueryDto extends createZodDto(cursorPaginationQuerySchema) {}
