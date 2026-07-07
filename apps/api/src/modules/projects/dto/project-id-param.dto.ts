import { projectIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ProjectIdParamDto extends createZodDto(projectIdParamSchema) {}
