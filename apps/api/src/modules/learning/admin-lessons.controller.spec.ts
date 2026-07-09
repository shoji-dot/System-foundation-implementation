import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateLessonUsecase } from "../../core/usecases/create-lesson.usecase";
import { DeleteLessonUsecase } from "../../core/usecases/delete-lesson.usecase";
import { UpdateLessonUsecase } from "../../core/usecases/update-lesson.usecase";

import { AdminLessonsController } from "./admin-lessons.controller";

describe("AdminLessonsController", () => {
  let controller: AdminLessonsController;
  const createExecute = jest.fn();
  const updateExecute = jest.fn();
  const deleteExecute = jest.fn();
  const lessonId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f";
  const courseId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a";

  beforeEach(async () => {
    createExecute.mockReset();
    updateExecute.mockReset();
    deleteExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminLessonsController],
      providers: [
        { provide: CreateLessonUsecase, useValue: { execute: createExecute } },
        { provide: UpdateLessonUsecase, useValue: { execute: updateExecute } },
        { provide: DeleteLessonUsecase, useValue: { execute: deleteExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminLessonsController);
  });

  describe("create", () => {
    it("delegates to the usecase and returns the created lesson", async () => {
      createExecute.mockResolvedValue({
        id: lessonId,
        courseId,
        title: "レッスンA",
        body: "本文",
        order: 0,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.create({
        courseId,
        title: "レッスンA",
        body: "本文",
        order: 0,
      });

      expect(createExecute).toHaveBeenCalledWith({
        courseId,
        title: "レッスンA",
        body: "本文",
        order: 0,
      });
      expect(result).toEqual({
        id: lessonId,
        courseId,
        title: "レッスンA",
        order: 0,
        body: "本文",
      });
    });
  });

  describe("update", () => {
    it("delegates to the usecase with the param id and body fields", async () => {
      updateExecute.mockResolvedValue({
        id: lessonId,
        courseId,
        title: "新タイトル",
        body: "本文",
        order: 1,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.update({ id: lessonId }, { title: "新タイトル", order: 1 });

      expect(updateExecute).toHaveBeenCalledWith({
        id: lessonId,
        title: "新タイトル",
        body: undefined,
        order: 1,
      });
      expect(result.title).toBe("新タイトル");
    });
  });

  describe("remove", () => {
    it("delegates to the usecase with the param id", async () => {
      deleteExecute.mockResolvedValue(undefined);

      await controller.remove({ id: lessonId });

      expect(deleteExecute).toHaveBeenCalledWith(lessonId);
    });
  });
});
