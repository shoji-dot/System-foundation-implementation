import { ConflictException, NotFoundException } from "@nestjs/common";

import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";
import type { LessonRepository } from "../domain/lesson.repository";

import { DeleteCourseUsecase } from "./delete-course.usecase";

describe("DeleteCourseUsecase", () => {
  const course: Course = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    title: "企画・開発",
    description: null,
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
    const lessonRepository: jest.Mocked<LessonRepository> = {
      findMany: jest.fn(),
      findDetailById: jest.fn(),
    };
    const usecase = new DeleteCourseUsecase(courseRepository, lessonRepository);
    return { usecase, courseRepository, lessonRepository };
  }

  it("deletes a course with no lessons", async () => {
    const { usecase, courseRepository, lessonRepository } = setup();
    courseRepository.findById.mockResolvedValue(course);
    lessonRepository.findMany.mockResolvedValue({ items: [], nextCursor: null });

    await usecase.execute(course.id);

    expect(lessonRepository.findMany).toHaveBeenCalledWith({ courseId: course.id, limit: 1 });
    expect(courseRepository.delete).toHaveBeenCalledWith(course.id);
  });

  it("rejects when the course does not exist", async () => {
    const { usecase, courseRepository } = setup();
    courseRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute("missing")).rejects.toBeInstanceOf(NotFoundException);
    expect(courseRepository.delete).not.toHaveBeenCalled();
  });

  it("rejects when the course still has lessons", async () => {
    const { usecase, courseRepository, lessonRepository } = setup();
    courseRepository.findById.mockResolvedValue(course);
    lessonRepository.findMany.mockResolvedValue({
      items: [{ id: "lesson-1", courseId: course.id, title: "レッスン", order: 0 }],
      nextCursor: null,
    });

    await expect(usecase.execute(course.id)).rejects.toBeInstanceOf(ConflictException);
    expect(courseRepository.delete).not.toHaveBeenCalled();
  });
});
