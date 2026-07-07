import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateCourseUsecase } from "../../core/usecases/create-course.usecase";
import { DeleteCourseUsecase } from "../../core/usecases/delete-course.usecase";
import { UpdateCourseUsecase } from "../../core/usecases/update-course.usecase";

import { AdminCoursesController } from "./admin-courses.controller";

describe("AdminCoursesController", () => {
  let controller: AdminCoursesController;
  const createExecute = jest.fn();
  const updateExecute = jest.fn();
  const deleteExecute = jest.fn();
  const courseId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a";

  beforeEach(async () => {
    createExecute.mockReset();
    updateExecute.mockReset();
    deleteExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCoursesController],
      providers: [
        { provide: CreateCourseUsecase, useValue: { execute: createExecute } },
        { provide: UpdateCourseUsecase, useValue: { execute: updateExecute } },
        { provide: DeleteCourseUsecase, useValue: { execute: deleteExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AdminCoursesController);
  });

  describe("create", () => {
    it("delegates to the usecase and returns the created course", async () => {
      createExecute.mockResolvedValue({
        id: courseId,
        title: "企画・開発",
        description: "説明",
        order: 0,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.create({
        title: "企画・開発",
        description: "説明",
        order: 0,
      });

      expect(createExecute).toHaveBeenCalledWith({
        title: "企画・開発",
        description: "説明",
        order: 0,
      });
      expect(result).toEqual({
        id: courseId,
        title: "企画・開発",
        description: "説明",
        order: 0,
      });
    });
  });

  describe("update", () => {
    it("delegates to the usecase with the param id and body fields", async () => {
      updateExecute.mockResolvedValue({
        id: courseId,
        title: "新タイトル",
        description: null,
        order: 1,
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.update({ id: courseId }, { title: "新タイトル", order: 1 });

      expect(updateExecute).toHaveBeenCalledWith({
        id: courseId,
        title: "新タイトル",
        description: undefined,
        order: 1,
      });
      expect(result.title).toBe("新タイトル");
    });
  });

  describe("remove", () => {
    it("delegates to the usecase with the param id", async () => {
      deleteExecute.mockResolvedValue(undefined);

      await controller.remove({ id: courseId });

      expect(deleteExecute).toHaveBeenCalledWith(courseId);
    });
  });
});
