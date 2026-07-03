"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SignupRequest } from "@yakuji/shared";
import { signupRequestSchema } from "@yakuji/shared";
import { Button, Input } from "@yakuji/ui";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { signup, SignupError } from "../api/signup";

/** 設計書⑫ S02。NestJS /auth/signup でアカウント作成後、続けてAuth.js経由で自動ログインする。 */
export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupRequest>({ resolver: zodResolver(signupRequestSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);

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
