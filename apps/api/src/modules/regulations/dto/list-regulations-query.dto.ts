import { listRegulationsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListRegulationsQueryDto extends createZodDto(listRegulationsQuerySchema) {}
