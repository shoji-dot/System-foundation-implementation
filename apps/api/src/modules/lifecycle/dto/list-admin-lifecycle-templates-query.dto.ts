import { listAdminLifecycleTemplatesQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListAdminLifecycleTemplatesQueryDto extends createZodDto(
  listAdminLifecycleTemplatesQuerySchema,
) {}
