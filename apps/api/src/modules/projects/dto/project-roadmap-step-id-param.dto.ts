import { projectRoadmapStepIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ProjectRoadmapStepIdParamDto extends createZodDto(projectRoadmapStepIdParamSchema) {}
