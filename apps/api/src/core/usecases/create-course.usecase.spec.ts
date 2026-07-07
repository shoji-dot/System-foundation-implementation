import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";

import { CreateCourseUsecase } from "./create-course.usecase";

describe("CreateCourseUsecase", () => {
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
    const usecase = new CreateCourseUsecase(courseRepository);
    return { usecase, courseRepository };
  }

  it("creates a course with a trimmed title", async () => {
    const { usecase, courseRepository } = setup();
    courseRepository.create.mockResolvedValue(course);

    const result = await usecase.execute({
      title: "  企画・開発  ",
      description: "説明",
      order: 0,
    });

    expect(courseRepository.create).toHaveBeenCalledWith({
      title: "企画・開発",
      description: "説明",
      order: 0,
    });
    expect(result).toEqual(course);
  });

  it("defaults description to null when omitted", async () => {
    const { usecase, courseRepository } = setup();
    courseRepository.create.mockResolvedValue(course);

    await usecase.execute({ title: "企画・開発", order: 0 });

    expect(courseRepository.create).toHaveBeenCalledWith({
      title: "企画・開発",
      description: null,
      order: 0,
    });
  });
});
