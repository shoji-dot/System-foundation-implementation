import { classificationIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ClassificationIdParamDto extends createZodDto(classificationIdParamSchema) {}
