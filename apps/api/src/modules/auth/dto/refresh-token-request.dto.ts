import { refreshTokenRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class RefreshTokenRequestDto extends createZodDto(refreshTokenRequestSchema) {}
