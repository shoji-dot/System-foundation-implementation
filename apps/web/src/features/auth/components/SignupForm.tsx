"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SignupRequest } from "@yakuji/shared";
import { signupRequestSchema } from "@yakuji/shared";
import { Button, Checkbox, Input } from "@yakuji/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { signup, SignupError } from "../api/signup";

const TERMS_NOT_AGREED_MESSAGE = "利用規約およびプライバシーポリシーへの同意が必要です。";

/**
 * 設計書⑫ S02。NestJS /auth/signup でアカウント作成後、続けてAuth.js経由で自動ログインする。
 * 利用規約第3条3項（電磁的方法による同意）に対応する同意チェックボックスを追加。
 * APIへ送信するSignupRequestのスキーマ(@yakuji/shared)自体は変更せず、同意はクライアント側の
 * 送信前バリデーションとしてのみ扱う（バックエンド契約への影響を避けるための最小実装）。
 */
export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupRequest>({ resolver: zodResolver(signupRequestSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);

    if (!termsAgreed) {
      setTermsError(TERMS_NOT_AGREED_MESSAGE);
      return;
    }
    setTermsError(null);

    try {
      await signup(data);
    } catch (error) {
      setFormError(error instanceof SignupError ? error.message : "登録に失敗しました。");
      return;
    }

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      <Input
        label="氏名"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="メールアドレス"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="パスワード"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Checkbox
        checked={termsAgreed}
        onChange={(event) => {
          setTermsAgreed(event.target.checked);
          if (event.target.checked) {
            setTermsError(null);
          }
        }}
        error={termsError ?? undefined}
        label={
          <>
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              利用規約
            </Link>
            及び
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              プライバシーポリシー
            </Link>
            に同意します
          </>
        }
      />
      {formError ? (
        <p role="alert" className="text-[14px] text-danger">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "登録中…" : "登録する"}
      </Button>
    </form>
  );
}
