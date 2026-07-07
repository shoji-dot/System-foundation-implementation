import { NotFoundException } from "@nestjs/common";

import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";

import { GetCourseDetailUsecase } from "./get-course-detail.usecase";

describe("GetCourseDetailUsecase", () => {
  const course: Course = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    title: "企画・開発",
    description: "医療機器の企画・開発フェーズにおける薬事の基礎",
    order: 0,
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
    updatedAt: new Date("2026-07-04T00:00:00.000Z"),
  };

  function setup() {
    const courseRepository: jest.Mocked<CourseRepository> = {
      findMany: jest.fn(),
      findById: jest.fn(),
    };
    const usecase = new GetCourseDetailUsecase(courseRepository);
    return { usecase, courseRepository };
  }

  it("returns the course from the repository", async () => {
    const { usecase, courseRepository } = setup();
    courseRepository.findById.mockResolvedValue(course);

    const result = await usecase.execute(course.id);

    expect(courseRepository.findById).toHaveBeenCalledWith(course.id);
    expect(result).toEqual(course);
  });

  it("throws NotFoundException when the course does not exist", async () => {
    const { usecase, courseRepository } = setup();
    courseRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute(course.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
