import { subscriptionIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class SubscriptionIdParamDto extends createZodDto(subscriptionIdParamSchema) {}
