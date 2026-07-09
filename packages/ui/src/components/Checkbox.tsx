import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * 設計書⑭ デザインシステム準拠のCheckbox。ラベルにリンク等のインライン要素を含められるよう
 * `label`は文字列に限定しない（例: サインアップ画面の規約同意チェックボックス）。
 * Inputコンポーネントと同様、label関連付け・aria-invalid・aria-describedby・role="alert"に対応する。
 * タップ領域は「チェックボックス+ラベル行」全体が44px以上になるよう確保する（Apple HIG準拠）。
 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-[44px] items-start gap-2">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={[
            "mt-0.5 h-5 w-5 shrink-0 rounded-sm border border-border bg-bg text-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            error ? "border-danger" : "",
            className,
          ].join(" ")}
          {...props}
        />
        <label htmlFor={inputId} className="text-[14px] leading-relaxed text-text">
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-[14px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
});
