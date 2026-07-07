import { ConflictException, NotFoundException } from "@nestjs/common";

import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";

import { UpdateLessonUsecase } from "./update-lesson.usecase";

describe("UpdateLessonUsecase", () => {
  const lesson: Lesson = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    title: "レッスンA",
    body: "本文",
    order: 0,
    createdAt: new Date("2026-07-07T00:00:00.000Z"),
    updatedAt: new Date("2026-07-07T00:00:00.000Z"),
  };
  const otherLesson: Lesson = { ...lesson, id: "other-id", order: 1 };

  function setup() {
    const lessonRepository: jest.Mocked<LessonRepository> = {
      findMany: jest.fn(),
      findDetailById: jest.fn(),
      findByCourseIdAndOrder: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const usecase = new UpdateLessonUsecase(lessonRepository);
    return { usecase, lessonRepository };
  }

  it("updates fields without checking order when order is unchanged", async () => {
    const { usecase, lessonRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);
    lessonRepository.update.mockResolvedValue({ ...lesson, title: "新タイトル" });

    const result = await usecase.execute({ id: lesson.id, title: "  新タイトル  " });

    expect(lessonRepository.findByCourseIdAndOrder).not.toHaveBeenCalled();
    expect(lessonRepository.update).toHaveBeenCalledWith(lesson.id, {
      title: "新タイトル",
      body: undefined,
      order: undefined,
    });
    expect(result.title).toBe("新タイトル");
  });

  it("checks for order conflicts when order changes", async () => {
    const { usecase, lessonRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);
    lessonRepository.findByCourseIdAndOrder.mockResolvedValue(null);
    lessonRepository.update.mockResolvedValue({ ...lesson, order: 2 });

    await usecase.execute({ id: lesson.id, order: 2 });

    expect(lessonRepository.findByCourseIdAndOrder).toHaveBeenCalledWith(lesson.courseId, 2);
    expect(lessonRepository.update).toHaveBeenCalledWith(lesson.id, {
      title: undefined,
      body: undefined,
      order: 2,
    });
  });

  it("rejects when the lesson does not exist", async () => {
    const { usecase, lessonRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(null);

    await expect(usecase.execute({ id: "missing", title: "新タイトル" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(lessonRepository.update).not.toHaveBeenCalled();
  });

  it("rejects when another lesson in the same course already has the target order", async () => {
    const { usecase, lessonRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);
    lessonRepository.findByCourseIdAndOrder.mockResolvedValue(otherLesson);

    await expect(usecase.execute({ id: lesson.id, order: 1 })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(lessonRepository.update).not.toHaveBeenCalled();
  });
});
