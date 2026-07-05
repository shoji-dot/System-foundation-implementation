import { listNotificationsQuerySchema } from "@yakuji/shared";

import { createZodDto } from "../../../common/dto/create-zod-dto";

export class ListNotificationsQueryDto extends createZodDto(listNotificationsQuerySchema) {}
