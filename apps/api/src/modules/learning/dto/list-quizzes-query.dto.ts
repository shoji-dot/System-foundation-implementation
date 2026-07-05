import { listQuizzesQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListQuizzesQueryDto extends createZodDto(listQuizzesQuerySchema) {}
