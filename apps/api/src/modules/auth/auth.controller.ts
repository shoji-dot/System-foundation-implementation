import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { UserResponse } from "@yakuji/shared";
import { userResponseSchema } from "@yakuji/shared";

import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";

import { SignupRequestDto } from "./dto/signup-request.dto";

/**
 * 設計書⑤ POST /api/v1/auth/{signup|login|logout|refresh}。
 * 本コミットでは signup のみ実装（login以降は別コミット）。
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly signupUserUsecase: SignupUserUsecase) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signup(@Body() dto: SignupRequestDto): Promise<UserResponse> {
    const user = await this.signupUserUsecase.execute(dto);

    return userResponseSchema.parse({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  }
}
