import { updateLifecycleTemplateRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateLifecycleTemplateRequestDto extends createZodDto(
  updateLifecycleTemplateRequestSchema,
) {}
