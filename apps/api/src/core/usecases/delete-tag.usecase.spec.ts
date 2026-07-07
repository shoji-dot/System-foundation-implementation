import { NotFoundException } from "@nestjs/common";

import type { Tag } from "../domain/tag.entity";
import type { TagRepository } from "../domain/tag.repository";

import { DeleteTagUsecase } from "./delete-tag.usecase";

describe("DeleteTagUsecase", () => {
  const tag: Tag = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    name: "タグA",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };

  function setup() {
    const tagRepository: jest.Mocked<TagRepository> = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const usecase = new DeleteTagUsecase(tagRepository);
    return { usecase, tagRepository };
  }

  it("deletes an existing tag", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findById.mockResolvedValue(tag);

    await usecase.execute(tag.id);

    expect(tagRepository.delete).toHaveBeenCalledWith(tag.id);
  });

  it("rejects when the tag does not exist", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute("missing")).rejects.toBeInstanceOf(NotFoundException);
    expect(tagRepository.delete).not.toHaveBeenCalled();
  });
});
