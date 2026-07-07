import { listTagsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListTagsQueryDto extends createZodDto(listTagsQuerySchema) {}
