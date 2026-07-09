import { NotFoundException } from "@nestjs/common";

import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";
import type { Tag } from "../domain/tag.entity";
import type { TaggingRepository } from "../domain/tagging.repository";

import { ListLessonTagsUsecase } from "./list-lesson-tags.usecase";

describe("ListLessonTagsUsecase", () => {
  const lesson: Lesson = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e50",
    title: "レッスンA",
    body: "本文",
    order: 1,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };
  const tag: Tag = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e51",
    name: "薬機法",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
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
    const usecase = new ListLessonTagsUsecase(lessonRepository, taggingRepository);
    return { usecase, lessonRepository, taggingRepository };
  }

  it("returns the tags attached to the lesson", async () => {
    const { usecase, lessonRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);
    taggingRepository.listTagsForTaggable.mockResolvedValue([tag]);

    const result = await usecase.execute({ lessonId: lesson.id });

    expect(taggingRepository.listTagsForTaggable).toHaveBeenCalledWith("LESSON", lesson.id);
    expect(result).toEqual([tag]);
  });

  it("rejects when the lesson does not exist", async () => {
    const { usecase, lessonRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(null);

    await expect(usecase.execute({ lessonId: "missing" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(taggingRepository.listTagsForTaggable).not.toHaveBeenCalled();
  });
});
