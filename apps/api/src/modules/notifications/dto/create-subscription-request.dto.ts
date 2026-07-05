import { createSubscriptionRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CreateSubscriptionRequestDto extends createZodDto(createSubscriptionRequestSchema) {}
