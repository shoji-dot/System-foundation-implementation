import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe Webhook署名検証（設計変更書③「署名検証」）。Stripe公式アルゴリズムを直接実装する
 * （SDK非導入方針、infrastructure/external/billing/stripe-client.tsから利用）。
 * 参考: https://docs.stripe.com/webhooks#verify-manually
 *
 * `Stripe-Signature: t=<timestamp>,v1=<signature>` の形式で送られてくる。
 * 署名対象文字列は `${timestamp}.${生ボディ}` のHMAC-SHA256(hex)。
 * タイムスタンプの許容誤差（既定300秒）を設けてリプレイ攻撃を軽減する（設計書 Security OWASP準拠）。
 */
export function verifyStripeSignature(
  payload: Buffer,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300,
): void {
  const parts = new Map(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value] as const;
    }),
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) {
    throw new Error("Stripe-Signatureヘッダの形式が不正です。");
  }

  const signedPayload = `${timestamp}.${payload.toString("utf8")}`;
  const expectedSignature = createHmac("sha256", secret).update(signedPayload).digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const actualBuffer = Buffer.from(signature, "hex");
  if (
    expectedBuffer.length !== actualBuffer.length ||
    !timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new Error("Stripe Webhookの署名検証に失敗しました。");
  }

  const timestampAgeSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (timestampAgeSeconds > toleranceSeconds) {
    throw new Error("Stripe Webhookのタイムスタンプが許容範囲外です（リプレイ攻撃対策）。");
  }
}
