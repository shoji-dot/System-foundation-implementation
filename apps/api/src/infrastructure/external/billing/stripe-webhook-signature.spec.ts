import { createHmac } from "node:crypto";

import { verifyStripeSignature } from "./stripe-webhook-signature";

const SECRET = "whsec_test_dummy";

function buildSignatureHeader(payload: Buffer, timestamp: number, secret = SECRET): string {
  const signedPayload = `${timestamp}.${payload.toString("utf8")}`;
  const signature = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("verifyStripeSignature", () => {
  it("does not throw for a validly signed, recent payload", () => {
    const payload = Buffer.from(
      JSON.stringify({ id: "evt_1", type: "customer.subscription.updated" }),
    );
    const header = buildSignatureHeader(payload, Math.floor(Date.now() / 1000));

    expect(() => verifyStripeSignature(payload, header, SECRET)).not.toThrow();
  });

  it("throws when the signature does not match the payload", () => {
    const payload = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const header = buildSignatureHeader(payload, Math.floor(Date.now() / 1000));
    const tamperedPayload = Buffer.from(JSON.stringify({ id: "evt_2" }));

    expect(() => verifyStripeSignature(tamperedPayload, header, SECRET)).toThrow(
      "Stripe Webhookの署名検証に失敗しました。",
    );
  });

  it("throws when signed with a different secret", () => {
    const payload = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const header = buildSignatureHeader(payload, Math.floor(Date.now() / 1000), "whsec_other");

    expect(() => verifyStripeSignature(payload, header, SECRET)).toThrow(
      "Stripe Webhookの署名検証に失敗しました。",
    );
  });

  it("throws when the header is missing t or v1", () => {
    const payload = Buffer.from("{}");

    expect(() => verifyStripeSignature(payload, "v1=abc", SECRET)).toThrow(
      "Stripe-Signatureヘッダの形式が不正です。",
    );
    expect(() => verifyStripeSignature(payload, "t=123", SECRET)).toThrow(
      "Stripe-Signatureヘッダの形式が不正です。",
    );
  });

  it("throws when the timestamp is outside the tolerance window", () => {
    const payload = Buffer.from(JSON.stringify({ id: "evt_1" }));
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
    const header = buildSignatureHeader(payload, oldTimestamp);

    expect(() => verifyStripeSignature(payload, header, SECRET)).toThrow(
      "Stripe Webhookのタイムスタンプが許容範囲外です（リプレイ攻撃対策）。",
    );
  });
});
