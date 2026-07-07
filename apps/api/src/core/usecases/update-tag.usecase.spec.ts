import { ConflictException, NotFoundException } from "@nestjs/common";

import type { Tag } from "../domain/tag.entity";
import type { TagRepository } from "../domain/tag.repository";

import { UpdateTagUsecase } from "./update-tag.usecase";

describe("UpdateTagUsecase", () => {
  const tag: Tag = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    name: "旧名称",
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };
  const otherTag: Tag = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e50",
    name: "別のタグ",
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
    const usecase = new UpdateTagUsecase(tagRepository);
    return { usecase, tagRepository };
  }

  it("updates the tag name with trimming", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findById.mockResolvedValue(tag);
    tagRepository.findByName.mockResolvedValue(null);
    tagRepository.update.mockResolvedValue({ ...tag, name: "新名称" });

    const result = await usecase.execute({ id: tag.id, name: "  新名称  " });

    expect(tagRepository.update).toHaveBeenCalledWith(tag.id, { name: "新名称" });
    expect(result.name).toBe("新名称");
  });

  it("allows keeping the same name (findByName returns the same tag)", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findById.mockResolvedValue(tag);
    tagRepository.findByName.mockResolvedValue(tag);
    tagRepository.update.mockResolvedValue(tag);

    await expect(usecase.execute({ id: tag.id, name: "旧名称" })).resolves.toEqual(tag);
  });

  it("rejects when the tag does not exist", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findById.mockResolvedValue(null);

    await expect(usecase.execute({ id: "missing", name: "新名称" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tagRepository.update).not.toHaveBeenCalled();
  });

  it("rejects when another tag already has the target name", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.findById.mockResolvedValue(tag);
    tagRepository.findByName.mockResolvedValue(otherTag);

    await expect(usecase.execute({ id: tag.id, name: "別のタグ" })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tagRepository.update).not.toHaveBeenCalled();
  });
});
