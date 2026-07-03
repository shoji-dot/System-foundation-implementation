import { signupRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class SignupRequestDto extends createZodDto(signupRequestSchema) {}
