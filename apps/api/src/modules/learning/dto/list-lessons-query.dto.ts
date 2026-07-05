import { listLessonsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListLessonsQueryDto extends createZodDto(listLessonsQuerySchema) {}
