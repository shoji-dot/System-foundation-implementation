import { ConflictException } from "@nestjs/common";

import type { Tag } from "../domain/tag.entity";
import type { TagRepository } from "../domain/tag.repository";

import { CreateTagUsecase } from "./create-tag.usecase";

describe("CreateTagUsecase", () => {
  const existingTag: Tag = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    name: "既存タグ",
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
    const usecase = new CreateTagUsecase(tagRepository);
    return { usecase, tagRepository };
  }

  it("creates a new tag with a trimmed name", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findByName.mockResolvedValue(null);
    tagRepository.create.mockResolvedValue({ ...existingTag, id: "new-id", name: "新規タグ" });

    const result = await usecase.execute({ name: "  新規タグ  " });

    expect(tagRepository.findByName).toHaveBeenCalledWith("新規タグ");
    expect(tagRepository.create).toHaveBeenCalledWith({ name: "新規タグ" });
    expect(result.name).toBe("新規タグ");
  });

  it("rejects creation when a tag with the same name already exists", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findByName.mockResolvedValue(existingTag);

    await expect(usecase.execute({ name: "既存タグ" })).rejects.toBeInstanceOf(ConflictException);
    expect(tagRepository.create).not.toHaveBeenCalled();
  });
});
