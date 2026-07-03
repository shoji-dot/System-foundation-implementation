import { regulationIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class RegulationIdParamDto extends createZodDto(regulationIdParamSchema) {}
