import { listProjectsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListProjectsQueryDto extends createZodDto(listProjectsQuerySchema) {}
