import { ConflictException, NotFoundException } from "@nestjs/common";

import type { Lesson } from "../domain/lesson.entity";
import type { LessonRepository } from "../domain/lesson.repository";
import type { Tag } from "../domain/tag.entity";
import type { TagRepository } from "../domain/tag.repository";
import type { TaggingRepository } from "../domain/tagging.repository";

import { AttachTagToLessonUsecase } from "./attach-tag-to-lesson.usecase";

describe("AttachTagToLessonUsecase", () => {
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
    };
    const tagRepository: jest.Mocked<TagRepository> = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const taggingRepository: jest.Mocked<TaggingRepository> = {
      create: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      listTagsForTaggable: jest.fn(),
    };
    const usecase = new AttachTagToLessonUsecase(
      lessonRepository,
      tagRepository,
      taggingRepository,
    );
    return { usecase, lessonRepository, tagRepository, taggingRepository };
  }

  it("attaches the tag to the lesson", async () => {
    const { usecase, lessonRepository, tagRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);
    tagRepository.findById.mockResolvedValue(tag);
    taggingRepository.exists.mockResolvedValue(false);

    await usecase.execute({ lessonId: lesson.id, tagId: tag.id });

    expect(taggingRepository.create).toHaveBeenCalledWith({
      tagId: tag.id,
      taggableType: "LESSON",
      taggableId: lesson.id,
    });
  });

  it("rejects when the lesson does not exist", async () => {
    const { usecase, lessonRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(null);

    await expect(usecase.execute({ lessonId: "missing", tagId: tag.id })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(taggingRepository.create).not.toHaveBeenCalled();
  });

  it("rejects when the tag does not exist", async () => {
    const { usecase, lessonRepository, tagRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);
    tagRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute({ lessonId: lesson.id, tagId: "missing" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(taggingRepository.create).not.toHaveBeenCalled();
  });

  it("rejects when the tag is already attached", async () => {
    const { usecase, lessonRepository, tagRepository, taggingRepository } = setup();
    lessonRepository.findDetailById.mockResolvedValue(lesson);
    tagRepository.findById.mockResolvedValue(tag);
    taggingRepository.exists.mockResolvedValue(true);

    await expect(usecase.execute({ lessonId: lesson.id, tagId: tag.id })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(taggingRepository.create).not.toHaveBeenCalled();
  });
});
