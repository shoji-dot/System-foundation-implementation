import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AttachTagToLessonUsecase } from "../../core/usecases/attach-tag-to-lesson.usecase";
import { DetachTagFromLessonUsecase } from "../../core/usecases/detach-tag-from-lesson.usecase";
import { ListLessonTagsUsecase } from "../../core/usecases/list-lesson-tags.usecase";

import { LessonTagsController } from "./lesson-tags.controller";

describe("LessonTagsController", () => {
  let controller: LessonTagsController;
  const listExecute = jest.fn();
  const attachExecute = jest.fn();
  const detachExecute = jest.fn();
  const lessonId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f";
  const tagId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e51";

  beforeEach(async () => {
    listExecute.mockReset();
    attachExecute.mockReset();
    detachExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonTagsController],
      providers: [
        { provide: ListLessonTagsUsecase, useValue: { execute: listExecute } },
        { provide: AttachTagToLessonUsecase, useValue: { execute: attachExecute } },
        { provide: DetachTagFromLessonUsecase, useValue: { execute: detachExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(LessonTagsController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs, formatting date fields as ISO strings", async () => {
      listExecute.mockResolvedValue([
        {
          id: tagId,
          name: "薬機法",
          createdAt: new Date("2026-07-07T00:00:00.000Z"),
          updatedAt: new Date("2026-07-07T00:00:00.000Z"),
        },
      ]);

      const result = await controller.list({ lessonId });

      expect(listExecute).toHaveBeenCalledWith({ lessonId });
      expect(result).toEqual({
        items: [
          {
            id: tagId,
            name: "薬機法",
            createdAt: "2026-07-07T00:00:00.000Z",
            updatedAt: "2026-07-07T00:00:00.000Z",
          },
        ],
      });
    });
  });

  describe("attach", () => {
    it("delegates to the usecase with the lessonId and body tagId", async () => {
      attachExecute.mockResolvedValue(undefined);

      await controller.attach({ lessonId }, { tagId });

      expect(attachExecute).toHaveBeenCalledWith({ lessonId, tagId });
    });
  });

  describe("detach", () => {
    it("delegates to the usecase with the lessonId and tagId params", async () => {
      detachExecute.mockResolvedValue(undefined);

      await controller.detach({ lessonId, tagId });

      expect(detachExecute).toHaveBeenCalledWith({ lessonId, tagId });
    });
  });
});
