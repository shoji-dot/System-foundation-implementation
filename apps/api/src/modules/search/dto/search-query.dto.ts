import { searchQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class SearchQueryDto extends createZodDto(searchQuerySchema) {}
