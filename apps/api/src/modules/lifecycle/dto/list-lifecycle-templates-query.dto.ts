import { listLifecycleTemplatesQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListLifecycleTemplatesQueryDto extends createZodDto(
  listLifecycleTemplatesQuerySchema,
) {}
