import { updateUserRoleRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateUserRoleRequestDto extends createZodDto(updateUserRoleRequestSchema) {}
