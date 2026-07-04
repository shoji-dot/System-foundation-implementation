import { listRegulationVersionsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListRegulationVersionsQueryDto extends createZodDto(
  listRegulationVersionsQuerySchema,
) {}
