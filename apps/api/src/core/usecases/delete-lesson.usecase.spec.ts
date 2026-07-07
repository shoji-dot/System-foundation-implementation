import { NotFoundException } from "@nestjs/common";

import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";
import type { TaggingRepository } from "../domain/tagging.repository";

import { DeleteLessonUsecase } from "./delete-lesson.usecase";

describe("DeleteLessonUsecase", () => {
  const lesson: Lesson = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
    title: "レッスンA",
    body: "本文",
    order: 0,
    createdAt: new Date("2026-07-07T00:00:00.000Z"),
    updatedAt: new Date("2026-07-07T00:00:00.000Z"),
  };

  function setup() {
    const lessonRepository: jest.Mocked<LessonRepository> = {
      findMany: jest.fn(),
      findDetailById: jest.fn(),
      findByCourseIdAndOrder: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const taggingRepository: jest.Mocked<TaggingRepository> = {
      create: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      deleteAllForTaggable: jest.fn(),
      listTagsForTaggable: jest.fn(),
    };
    const usecase = new DeleteLessonUsecase(lessonRepository, taggingRepository);
    return { usecase, lessonRepository, taggingRepository };
  }

  it("deletes the lesson's taggings before deleting the lesson itself", async () => {
    const { usecase, lessonRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);

    await usecase.execute(lesson.id);

    expect(taggingRepository.deleteAllForTaggable).toHaveBeenCalledWith("LESSON", lesson.id);
    expect(lessonRepository.delete).toHaveBeenCalledWith(lesson.id);
  });

  it("rejects when the lesson does not exist", async () => {
    const { usecase, lessonRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(null);

    await expect(usecase.execute("missing")).rejects.toBeInstanceOf(NotFoundException);
    expect(taggingRepository.deleteAllForTaggable).not.toHaveBeenCalled();
    expect(lessonRepository.delete).not.toHaveBeenCalled();
  });
});
