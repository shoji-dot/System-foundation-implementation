import { NotFoundException } from "@nestjs/common";

import type { TaggingRepository } from "../domain/tagging.repository";

import { DetachTagFromLessonUsecase } from "./detach-tag-from-lesson.usecase";

describe("DetachTagFromLessonUsecase", () => {
  const lessonId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f";
  const tagId = "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e51";

  function setup() {
    const taggingRepository: jest.Mocked<TaggingRepository> = {
      create: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      listTagsForTaggable: jest.fn(),
    };
    const usecase = new DetachTagFromLessonUsecase(taggingRepository);
    return { usecase, taggingRepository };
  }

  it("detaches the tag from the lesson", async () => {
    const { usecase, taggingRepository } = setup();
    taggingRepository.exists.mockResolvedValue(true);

    await usecase.execute({ lessonId, tagId });

    expect(taggingRepository.delete).toHaveBeenCalledWith(tagId, "LESSON", lessonId);
  });

  it("rejects when the tagging does not exist", async () => {
    const { usecase, taggingRepository } = setup();
    taggingRepository.exists.mockResolvedValue(false);

    await expect(usecase.execute({ lessonId, tagId })).rejects.toBeInstanceOf(NotFoundException);
    expect(taggingRepository.delete).not.toHaveBeenCalled();
  });
});
