"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { LoginRequest } from "@yakuji/shared";
import { loginRequestSchema } from "@yakuji/shared";
import { Button, Input } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

/** 設計書⑫ S02。Auth.js Credentials Provider経由でNestJS /auth/login を呼ぶ（設計書⑦）。 */
export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ resolver: zodResolver(loginRequestSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setFormError("メールアドレスまたはパスワードが正しくありません。");
      return;
    }

    router.push("/");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {formError ? (
        <p role="alert" className="text-[14px] text-danger">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "ログイン中…" : "ログイン"}
      </Button>
    </form>
  );
}
