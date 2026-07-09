import { updateProfileRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class UpdateProfileRequestDto extends createZodDto(updateProfileRequestSchema) {}
