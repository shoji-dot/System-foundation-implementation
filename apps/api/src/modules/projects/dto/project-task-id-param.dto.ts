import { projectTaskIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ProjectTaskIdParamDto extends createZodDto(projectTaskIdParamSchema) {}
