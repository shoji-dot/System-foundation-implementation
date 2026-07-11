import { generateProjectRoadmapRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class GenerateProjectRoadmapRequestDto extends createZodDto(
  generateProjectRoadmapRequestSchema,
) {}
