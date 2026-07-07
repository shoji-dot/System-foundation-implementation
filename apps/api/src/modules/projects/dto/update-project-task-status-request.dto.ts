import { updateProjectTaskStatusRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateProjectTaskStatusRequestDto extends createZodDto(
  updateProjectTaskStatusRequestSchema,
) {}
