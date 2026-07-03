import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { TokenPairResponse, UserResponse } from "@yakuji/shared";
import { tokenPairResponseSchema, userResponseSchema } from "@yakuji/shared";

import { LoginUserUsecase } from "../../core/usecases/login-user.usecase";
import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";

import { LoginRequestDto } from "./dto/login-request.dto";
import { SignupRequestDto } from "./dto/signup-request.dto";

/**
 * 設計書⑤ POST /api/v1/auth/{signup|login|logout|refresh}。
 * 本コミットまでで signup / login を実装（logout/refreshは別コミット）。
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly signupUserUsecase: SignupUserUsecase,
    private readonly loginUserUsecase: LoginUserUsecase,
  ) {}

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

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginRequestDto): Promise<TokenPairResponse> {
    const tokens = await this.loginUserUsecase.execute(dto);

    return tokenPairResponseSchema.parse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: "Bearer" as const,
      expiresIn: tokens.accessTokenExpiresIn,
    });
  }
}
