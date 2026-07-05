import { recordProgressRequestSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class RecordProgressRequestDto extends createZodDto(recordProgressRequestSchema) {}
