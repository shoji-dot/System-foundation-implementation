import { listPendingReviewVersionsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListPendingReviewVersionsQueryDto extends createZodDto(
  listPendingReviewVersionsQuerySchema,
) {}
