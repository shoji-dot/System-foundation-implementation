import { Injectable } from "@nestjs/common";
import type {
  LifecyclePhase as PrismaLifecyclePhase,
  LifecycleTemplateStep as PrismaLifecycleTemplateStep,
  Prisma,
  ProjectRoadmap as PrismaProjectRoadmap,
  ProjectRoadmapStep as PrismaProjectRoadmapStep,
} from "@prisma/client";
import { z } from "zod";

import type { LifecycleTemplateStep } from "../../../core/domain/lifecycle-template.entity";
import type {
  ProjectRoadmap,
  ProjectRoadmapDetail,
  ProjectRoadmapStep,
  ProjectRoadmapStepDetail,
  RoadmapStatus,
  RoadmapStepStatus,
} from "../../../core/domain/project-roadmap.entity";
import type {
  GenerateProjectRoadmapInput,
  ProjectRoadmapRepository,
  UpdateProjectRoadmapStepInput,
} from "../../../core/domain/project-roadmap.repository";
import { PrismaService } from "../prisma.service";

type TemplateStepWithPhase = PrismaLifecycleTemplateStep & { phase: PrismaLifecyclePhase };
type RoadmapStepWithTemplateStep = PrismaProjectRoadmapStep & {
  templateStep: TemplateStepWithPhase;
};
type RoadmapWithSteps = PrismaProjectRoadmap & { steps: RoadmapStepWithTemplateStep[] };

/** project_roadmap_stepsのjsonb由来ではないが、複製元lifecycle_template_stepsのjsonb列の実行時検証。 */
const stringArraySchema = z.array(z.string());
const sourceRefsSchema = z.array(z.object({ title: z.string(), url: z.string() }));

const DETAIL_INCLUDE = {
  // idはUUIDv7（生成順に単調増加）のため、id昇順=テンプレート複製時の順序（PrismaProjectTaskRepositoryと同方針）。
  steps: {
    orderBy: { id: "asc" as const },
    include: { templateStep: { include: { phase: true } } },
  },
} satisfies Prisma.ProjectRoadmapInclude;

/**
 * ProjectRoadmapRepository の Prisma 実装（設計書③ infrastructure/database、Repository Pattern、
 * Phase7 7-3 PR②-1）。
 */
@Injectable()
export class PrismaProjectRoadmapRepository implements ProjectRoadmapRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: GenerateProjectRoadmapInput): Promise<ProjectRoadmapDetail | null> {
    return this.prisma.$transaction(async (tx) => {
      // projectIdのunique制約に対するレース対策の防御的再チェック（PrismaLifecycleTemplateRepositoryと同方針）。
      const existing = await tx.projectRoadmap.findUnique({
        where: { projectId: input.projectId },
      });
      if (existing) {
        return null;
      }

      const record = await tx.projectRoadmap.create({
        data: {
          projectId: input.projectId,
          templateId: input.templateId,
          generatedAt: input.generatedAt,
          steps: {
            create: input.templateStepIds.map((templateStepId) => ({ templateStepId })),
          },
        },
        include: DETAIL_INCLUDE,
      });

      return this.toDetailDomain(record);
    });
  }

  async findDetailByProjectId(projectId: string): Promise<ProjectRoadmapDetail | null> {
    const record = await this.prisma.projectRoadmap.findUnique({
      where: { projectId },
      include: DETAIL_INCLUDE,
    });

    return record ? this.toDetailDomain(record) : null;
  }

  async findStepByIdForRoadmap(
    stepId: string,
    roadmapId: string,
  ): Promise<ProjectRoadmapStep | null> {
    const record = await this.prisma.projectRoadmapStep.findFirst({
      where: { id: stepId, roadmapId },
    });

    return record ? this.toStepDomain(record) : null;
  }

  async updateStep(
    stepId: string,
    input: UpdateProjectRoadmapStepInput,
  ): Promise<ProjectRoadmapStepDetail> {
    const data: Prisma.ProjectRoadmapStepUpdateInput = {};
    if (input.status !== undefined) {
      data.status = input.status;
    }
    if (input.plannedStartDate !== undefined) {
      data.plannedStartDate = input.plannedStartDate;
    }
    if (input.plannedEndDate !== undefined) {
      data.plannedEndDate = input.plannedEndDate;
    }
    if (input.actualStartDate !== undefined) {
      data.actualStartDate = input.actualStartDate;
    }
    if (input.actualEndDate !== undefined) {
      data.actualEndDate = input.actualEndDate;
    }
    if (input.assigneeId !== undefined) {
      data.assignee = input.assigneeId
        ? { connect: { id: input.assigneeId } }
        : { disconnect: true };
    }

    const record = await this.prisma.projectRoadmapStep.update({
      where: { id: stepId },
      data,
      include: { templateStep: { include: { phase: true } } },
    });

    return this.toStepDetailDomain(record);
  }

  async countForUser(userId: string): Promise<number> {
    return this.prisma.projectRoadmap.count({ where: { project: { userId } } });
  }

  private toDomain(record: PrismaProjectRoadmap): ProjectRoadmap {
    return {
      id: record.id,
      projectId: record.projectId,
      templateId: record.templateId,
      generatedAt: record.generatedAt,
      // PR②-1ではAI補完自体を実装しないため常にnull（PR②-2で確定するまでDB値を素通しにしない）。
      aiAdjustments: null,
      status: record.status as RoadmapStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toDetailDomain(record: RoadmapWithSteps): ProjectRoadmapDetail {
    return {
      ...this.toDomain(record),
      steps: record.steps.map((step) => this.toStepDetailDomain(step)),
    };
  }

  private toStepDomain(record: PrismaProjectRoadmapStep): ProjectRoadmapStep {
    return {
      id: record.id,
      roadmapId: record.roadmapId,
      templateStepId: record.templateStepId,
      status: record.status as RoadmapStepStatus,
      plannedStartDate: record.plannedStartDate,
      plannedEndDate: record.plannedEndDate,
      actualStartDate: record.actualStartDate,
      actualEndDate: record.actualEndDate,
      assigneeId: record.assigneeId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private toStepDetailDomain(record: RoadmapStepWithTemplateStep): ProjectRoadmapStepDetail {
    return {
      ...this.toStepDomain(record),
      templateStep: this.toTemplateStepDomain(record.templateStep),
    };
  }

  private toTemplateStepDomain(record: TemplateStepWithPhase): LifecycleTemplateStep {
    return {
      id: record.id,
      phase: {
        id: record.phase.id,
        code: record.phase.code,
        name: record.phase.name,
        order: record.phase.order,
      },
      name: record.name,
      order: record.order,
      durationMinDays: record.durationMinDays,
      durationMaxDays: record.durationMaxDays,
      costMinJpy: record.costMinJpy,
      costMaxJpy: record.costMaxJpy,
      requiredDocuments: stringArraySchema.parse(record.requiredDocuments),
      requiredTests: stringArraySchema.parse(record.requiredTests),
      relatedRegulationIds: record.relatedRegulationIds,
      pmdaResourceUrls: stringArraySchema.parse(record.pmdaResourceUrls),
      notes: record.notes,
      sourceRefs: sourceRefsSchema.parse(record.sourceRefs),
    };
  }
}
