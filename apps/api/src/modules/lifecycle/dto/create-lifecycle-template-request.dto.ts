import { createLifecycleTemplateRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreateLifecycleTemplateRequestDto extends createZodDto(
  createLifecycleTemplateRequestSchema,
) {}
