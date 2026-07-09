import { userIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UserIdParamDto extends createZodDto(userIdParamSchema) {}
