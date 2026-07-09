import { completeOnboardingRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class CompleteOnboardingRequestDto extends createZodDto(completeOnboardingRequestSchema) {}
