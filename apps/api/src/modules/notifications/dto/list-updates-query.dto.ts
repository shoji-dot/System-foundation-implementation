import { listUpdatesQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListUpdatesQueryDto extends createZodDto(listUpdatesQuerySchema) {}
