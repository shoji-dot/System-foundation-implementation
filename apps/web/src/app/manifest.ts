import type { MetadataRoute } from "next";

/**
 * Web App Manifest（設計書②⑫ PWA準拠: アイコン・standalone・テーマカラー・日英名称）。
 * アイコンはプレースホルダー（packages/ui のアクセントカラーを使った簡易マーク）。
 * 正式なブランドアイコンが用意され次第 apps/web/public/icons 配下を差し替える。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "医療機器薬事承認支援アプリ (Medical Device Regulatory Affairs Support)",
    short_name: "薬事支援",
    description:
      "医療機器の薬事承認業務を、法規制の検索・学習・実務支援で一気通貫にサポートするアプリ。",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0071e3",
    lang: "ja",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
