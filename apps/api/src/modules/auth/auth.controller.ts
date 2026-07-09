import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { TokenPairResponse, UserResponse } from "@yakuji/shared";
import { tokenPairResponseSchema, userResponseSchema } from "@yakuji/shared";

import { LoginUserUsecase } from "../../core/usecases/login-user.usecase";
import { LogoutUserUsecase } from "../../core/usecases/logout-user.usecase";
import { RefreshTokenUsecase } from "../../core/usecases/refresh-token.usecase";
import { SignupUserUsecase } from "../../core/usecases/signup-user.usecase";

import { LoginRequestDto } from "./dto/login-request.dto";
import { RefreshTokenRequestDto } from "./dto/refresh-token-request.dto";
import { SignupRequestDto } from "./dto/signup-request.dto";

/**
 * 設計書⑤ POST /api/v1/auth/{signup|login|logout|refresh}。
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly signupUserUsecase: SignupUserUsecase,
    private readonly loginUserUsecase: LoginUserUsecase,
    private readonly refreshTokenUsecase: RefreshTokenUsecase,
    private readonly logoutUserUsecase: LogoutUserUsecase,
  ) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async signup(@Body() dto: SignupRequestDto): Promise<UserResponse> {
    const user = await this.signupUserUsecase.execute(dto);

    return userResponseSchema.parse({
      ...user,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginRequestDto): Promise<TokenPairResponse> {
    const tokens = await this.loginUserUsecase.execute(dto);
    return this.toTokenPairResponse(tokens);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Body() dto: RefreshTokenRequestDto): Promise<TokenPairResponse> {
    const tokens = await this.refreshTokenUsecase.execute(dto.refreshToken);
    return this.toTokenPairResponse(tokens);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async logout(@Body() dto: RefreshTokenRequestDto): Promise<void> {
    await this.logoutUserUsecase.execute(dto.refreshToken);
  }

  private toTokenPairResponse(tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
  }): TokenPairResponse {
    return tokenPairResponseSchema.parse({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: "Bearer" as const,
      expiresIn: tokens.accessTokenExpiresIn,
    });
  }
}
