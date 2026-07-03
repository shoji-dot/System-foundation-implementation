import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

/**
 * 設計書⑭ デザインシステム準拠のInput。ラベル・エラーの紐付けまで含めてアクセシビリティ対応する
 * （WCAG 2.2 AA: label関連付け、aria-invalid、aria-describedby、role="alert"）。
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-[14px] font-medium text-text">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          "min-h-[44px] rounded-sm border border-border bg-bg px-3 text-[16px] text-text",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          error ? "border-danger" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
