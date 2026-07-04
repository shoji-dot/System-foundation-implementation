import { listClassificationsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListClassificationsQueryDto extends createZodDto(listClassificationsQuerySchema) {}
