import { updateProjectRoadmapStepRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateProjectRoadmapStepRequestDto extends createZodDto(
  updateProjectRoadmapStepRequestSchema,
) {}
