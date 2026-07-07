"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** hrefはtypedRoutes(next.config.ts)に対応するため`Route`型で固定の既知ルートのみ許可する。 */
interface NavItem {
  href: Route;
  label: string;
}

/**
 * 設計書⑫「グローバルナビ（モバイル下部タブ／PC左サイド）: ホーム・検索・学習・AI・プロジェクトの5項目固定」。
 * 検索(S05)・学習(S10)・AI(S14)はフロントエンド未実装のため、対応先は準備中ページ（/search, /courses, /ai）。
 */
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ホーム" },
  { href: "/search", label: "検索" },
  { href: "/courses", label: "学習" },
  { href: "/ai", label: "AI" },
  { href: "/projects", label: "プロジェクト" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  variant: "mobile" | "desktop";
}

function NavLink({ item, active, variant }: NavLinkProps) {
  const variantClassName =
    variant === "mobile" ? "flex-1 flex-col gap-0.5 text-[12px]" : "justify-start px-3 text-[16px]";

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-h-[44px] items-center justify-center gap-1 rounded-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        variantClassName,
        active ? "text-accent" : "text-text-secondary",
      ].join(" ")}
    >
      {item.label}
    </Link>
  );
}

/** 設計書⑫⑬: 同一ルーティングで、モバイルは下部タブバー・PCは左サイドバーに切り替える（レイアウトのみ切替）。 */
export function GlobalNav() {
  const pathname = usePathname();

  return (
    <>
      <nav
        aria-label="グローバルナビゲーション"
        className="fixed inset-x-0 bottom-0 z-10 flex h-14 border-t border-border bg-bg md:hidden"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} variant="mobile" />
        ))}
      </nav>

      <nav
        aria-label="グローバルナビゲーション"
        className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col gap-1 border-r border-border bg-bg p-4 md:flex"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} variant="desktop" />
        ))}
      </nav>
    </>
  );
}
