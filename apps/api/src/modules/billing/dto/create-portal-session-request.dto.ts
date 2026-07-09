import { createPortalSessionRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreatePortalSessionRequestDto extends createZodDto(
  createPortalSessionRequestSchema,
) {}
