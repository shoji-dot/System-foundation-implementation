import { listProgressQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListProgressQueryDto extends createZodDto(listProgressQuerySchema) {}
