import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { RegulationDiff, RegulationSectionDiff } from "../domain/regulation-diff.entity";
import type { RegulationSection, RegulationVersion } from "../domain/regulation-version.entity";
import type { RegulationRepository } from "../domain/regulation.repository";
import { REGULATION_REPOSITORY } from "../domain/regulation.repository";

export interface GetRegulationDiffInput {
  regulationId: string;
  from: number;
  to: number;
}

/**
 * 法規文書版間差分取得ユースケース（設計書⑤ GET /api/v1/regulations/:id/diff?from=&to=）。
 * 差分の粒度は条文セクション（path）単位。突合ロジックはアプリケーション層の責務のため、
 * リポジトリはfrom/to両版の生データ取得のみを担う（Clean Architecture）。
 */
@Injectable()
export class GetRegulationDiffUsecase {
  constructor(
    @Inject(REGULATION_REPOSITORY)
    private readonly regulationRepository: RegulationRepository,
  ) {}

  async execute(input: GetRegulationDiffInput): Promise<RegulationDiff> {
    const pair = await this.regulationRepository.findVersionsForDiff(
      input.regulationId,
      input.from,
      input.to,
    );

    if (!pair) {
      throw new NotFoundException("指定された法規文書または版が見つかりません。");
    }

    return {
      regulationId: input.regulationId,
      from: toVersionSummary(pair.from),
      to: toVersionSummary(pair.to),
      sections: diffSections(pair.from.sections, pair.to.sections),
    };
  }
}

function toVersionSummary(version: RegulationVersion) {
  return {
    id: version.id,
    versionNo: version.versionNo,
    publishedAt: version.publishedAt,
    effectiveFrom: version.effectiveFrom,
    effectiveTo: version.effectiveTo,
    summary: version.summary,
    changeSummary: version.changeSummary,
  };
}

/**
 * pathをキーにfrom/toのセクションを突合する。
 * 順序は「fromの原文順（modified/removed）→ toにのみ存在する新設分（added）を末尾に追加」。
 * 改正前の条文構成を主軸に読めるようにしつつ、新設条文も漏れなく末尾で提示する方針。
 */
function diffSections(
  fromSections: RegulationSection[],
  toSections: RegulationSection[],
): RegulationSectionDiff[] {
  const toByPath = new Map(toSections.map((section) => [section.path, section]));
  const fromPaths = new Set(fromSections.map((section) => section.path));

  const diffs: RegulationSectionDiff[] = fromSections.map((fromSection) => {
    const toSection = toByPath.get(fromSection.path);
    if (!toSection) {
      return {
        path: fromSection.path,
        heading: fromSection.heading,
        status: "removed",
        fromBody: fromSection.body,
        toBody: null,
      };
    }

    return {
      path: fromSection.path,
      heading: toSection.heading,
      status: fromSection.body === toSection.body ? "unchanged" : "modified",
      fromBody: fromSection.body,
      toBody: toSection.body,
    };
  });

  const addedDiffs: RegulationSectionDiff[] = toSections
    .filter((toSection) => !fromPaths.has(toSection.path))
    .map((toSection) => ({
      path: toSection.path,
      heading: toSection.heading,
      status: "added",
      fromBody: null,
      toBody: toSection.body,
    }));

  return [...diffs, ...addedDiffs];
}
