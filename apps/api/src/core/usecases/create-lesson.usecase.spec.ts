import { ConflictException, NotFoundException } from "@nestjs/common";

import type { Course } from "../domain/course.entity";
import type { CourseRepository } from "../domain/course.repository";
import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";

import { CreateLessonUsecase } from "./create-lesson.usecase";

describe("CreateLessonUsecase", () => {
  const course: Course = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    title: "企画・開発",
    description: null,
    order: 0,
    createdAt: new Date("2026-07-07T00:00:00.000Z"),
    updatedAt: new Date("2026-07-07T00:00:00.000Z"),
  };
  const lesson: Lesson = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    courseId: course.id,
    title: "レッスンA",
    body: "本文",
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
      findByCourseIdAndOrder: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const usecase = new CreateLessonUsecase(courseRepository, lessonRepository);
    return { usecase, courseRepository, lessonRepository };
  }

  it("creates a lesson with a trimmed title", async () => {
    const { usecase, courseRepository, lessonRepository } = setup();
    courseRepository.findById.mockResolvedValue(course);
    lessonRepository.findByCourseIdAndOrder.mockResolvedValue(null);
    lessonRepository.create.mockResolvedValue(lesson);

    const result = await usecase.execute({
      courseId: course.id,
      title: "  レッスンA  ",
      body: "本文",
      order: 0,
    });

    expect(lessonRepository.create).toHaveBeenCalledWith({
      courseId: course.id,
      title: "レッスンA",
      body: "本文",
      order: 0,
    });
    expect(result).toEqual(lesson);
  });

  it("rejects when the course does not exist", async () => {
    const { usecase, courseRepository, lessonRepository } = setup();
    courseRepository.findById.mockResolvedValue(null);

    await expect(
      usecase.execute({ courseId: "missing", title: "レッスンA", body: "本文", order: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(lessonRepository.create).not.toHaveBeenCalled();
  });

  it("rejects when a lesson with the same order already exists in the course", async () => {
    const { usecase, courseRepository, lessonRepository } = setup();
    courseRepository.findById.mockResolvedValue(course);
    lessonRepository.findByCourseIdAndOrder.mockResolvedValue(lesson);

    await expect(
      usecase.execute({ courseId: course.id, title: "レッスンB", body: "本文", order: 0 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(lessonRepository.create).not.toHaveBeenCalled();
  });
});
