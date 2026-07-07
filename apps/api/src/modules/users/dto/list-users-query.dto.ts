import { listUsersQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
