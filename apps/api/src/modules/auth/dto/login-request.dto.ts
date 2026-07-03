import { loginRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class LoginRequestDto extends createZodDto(loginRequestSchema) {}
