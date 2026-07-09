import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { BILLING_SUBSCRIPTION_REPOSITORY } from "../../core/domain/billing-subscription.repository";
import { MEMBERSHIP_REPOSITORY } from "../../core/domain/membership.repository";
import { STRIPE_CLIENT } from "../../core/domain/stripe-client";
import { TOKEN_SERVICE } from "../../core/domain/token-service";
import { CreateCheckoutSessionUsecase } from "../../core/usecases/create-checkout-session.usecase";
import { ProcessStripeWebhookUsecase } from "../../core/usecases/process-stripe-webhook.usecase";
import { PrismaModule } from "../../infrastructure/database/prisma.module";
import { PrismaBillingSubscriptionRepository } from "../../infrastructure/database/repositories/prisma-billing-subscription.repository";
import { PrismaMembershipRepository } from "../../infrastructure/database/repositories/prisma-membership.repository";
import { StripeRestClient } from "../../infrastructure/external/billing/stripe-client";
import { JwtTokenService } from "../../infrastructure/security/jwt-token.service";

import { BillingWebhookController } from "./billing-webhook.controller";
import { BillingController } from "./billing.controller";

/**
 * 設計変更書③ billingモジュール（Phase7 7-1）。JwtAuthGuard・MEMBERSHIP_REPOSITORYは
 * notifications/usersモジュール同様に自己完結で登録する。
 * BillingWebhookControllerはJwtAuthGuardを使わない（Stripeからの直接呼び出しのため）。
 */
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [BillingController, BillingWebhookController],
  providers: [
    CreateCheckoutSessionUsecase,
    ProcessStripeWebhookUsecase,
    { provide: MEMBERSHIP_REPOSITORY, useClass: PrismaMembershipRepository },
    { provide: BILLING_SUBSCRIPTION_REPOSITORY, useClass: PrismaBillingSubscriptionRepository },
    { provide: STRIPE_CLIENT, useClass: StripeRestClient },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
})
export class BillingModule {}
