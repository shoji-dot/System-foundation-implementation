import { NotFoundException } from "@nestjs/common";

import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";

import { UpdateCourseUsecase } from "./update-course.usecase";

describe("UpdateCourseUsecase", () => {
  const course: Course = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    title: "企画・開発",
    description: "医療機器の企画・開発フェーズにおける薬事の基礎",
    order: 0,
    createdAt: new Date("2026-07-07T00:00:00.000Z"),
    updatedAt: new Date("2026-07-07T00:00:00.000Z"),
  };

  function setup() {
    const courseRepository: jest.Mocked<CourseRepository> = {
      findMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const usecase = new UpdateCourseUsecase(courseRepository);
    return { usecase, courseRepository };
  }

  it("updates the course with the given fields", async () => {
    const { usecase, courseRepository } = setup();
    courseRepository.findById.mockResolvedValue(course);
    courseRepository.update.mockResolvedValue({ ...course, title: "新タイトル" });

    const result = await usecase.execute({ id: course.id, title: "  新タイトル  " });

    expect(courseRepository.update).toHaveBeenCalledWith(course.id, {
      title: "新タイトル",
      description: undefined,
      order: undefined,
    });
    expect(result.title).toBe("新タイトル");
  });

  it("rejects when the course does not exist", async () => {
    const { usecase, courseRepository } = setup();
    courseRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute({ id: "missing", title: "新タイトル" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(courseRepository.update).not.toHaveBeenCalled();
  });
});
