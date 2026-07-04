import { regulationDiffQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class RegulationDiffQueryDto extends createZodDto(regulationDiffQuerySchema) {}
