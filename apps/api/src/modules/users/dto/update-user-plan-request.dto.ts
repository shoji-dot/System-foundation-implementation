import { updateUserPlanRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateUserPlanRequestDto extends createZodDto(updateUserPlanRequestSchema) {}
