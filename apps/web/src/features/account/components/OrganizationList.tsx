import type { OrganizationMembershipResponse } from "@yakuji/shared";

const ORGANIZATION_TYPE_LABELS: Record<OrganizationMembershipResponse["organizationType"], string> =
  {
    MAKER: "製造業",
    MARKETING_HOLDER: "製造販売業",
    IMPORTER: "輸入業",
    ACADEMIC: "学術機関",
  };

const ORG_ROLE_LABELS: Record<OrganizationMembershipResponse["role"], string> = {
  ORG_ADMIN: "組織管理者",
  MEMBER: "メンバー",
};

interface OrganizationListProps {
  items: OrganizationMembershipResponse[];
}

/**
 * S19「アカウント設定・組織」表示（設計書⑫、GET /api/v1/me/organizations）。
 * 表示のみのスコープ（作成・招待・メンバー管理は対象外、ユーザー承認済み）のため、
 * SubscriptionListと異なりインタラクションを持たず、状態を持たないプレゼンテーション用コンポーネントとする。
 */
export function OrganizationList({ items }: OrganizationListProps) {
  if (items.length === 0) {
    return <p className="text-[14px] text-text-secondary">所属している組織はありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((membership) => (
        <li key={membership.organizationId} className="rounded-lg bg-surface p-4">
          <p className="text-[14px] font-medium text-text">{membership.organizationName}</p>
          <p className="text-[13px] text-text-secondary">
            {ORGANIZATION_TYPE_LABELS[membership.organizationType]}
            {" ・ "}
            {ORG_ROLE_LABELS[membership.role]}
          </p>
        </li>
      ))}
    </ul>
  );
}
