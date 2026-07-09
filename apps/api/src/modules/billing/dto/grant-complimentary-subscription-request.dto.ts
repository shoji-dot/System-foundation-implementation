import { grantComplimentarySubscriptionRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class GrantComplimentarySubscriptionRequestDto extends createZodDto(
  grantComplimentarySubscriptionRequestSchema,
) {}
