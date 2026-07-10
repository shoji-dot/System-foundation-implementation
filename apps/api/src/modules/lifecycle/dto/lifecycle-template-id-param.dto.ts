import { lifecycleTemplateIdParamSchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class LifecycleTemplateIdParamDto extends createZodDto(lifecycleTemplateIdParamSchema) {}
