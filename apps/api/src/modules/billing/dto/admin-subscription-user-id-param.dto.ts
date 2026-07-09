import { userIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class AdminSubscriptionUserIdParamDto extends createZodDto(userIdParamSchema) {}
