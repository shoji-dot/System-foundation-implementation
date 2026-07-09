import { tagIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class TagIdParamDto extends createZodDto(tagIdParamSchema) {}
