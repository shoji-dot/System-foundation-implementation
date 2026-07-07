import { listAuditLogsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListAuditLogsQueryDto extends createZodDto(listAuditLogsQuerySchema) {}
