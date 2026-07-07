import type { Tag } from "../domain/tag.entity";
import type { TagRepository } from "../domain/tag.repository";

import { ListTagsUsecase } from "./list-tags.usecase";

describe("ListTagsUsecase", () => {
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
    const usecase = new ListTagsUsecase(tagRepository);
    return { usecase, tagRepository };
  }

  it("delegates listing to the repository and returns its result as-is", async () => {
    const { usecase, tagRepository } = setup();
    tagRepository.list.mockResolvedValue({ items: [tag], nextCursor: null });

    const result = await usecase.execute({ cursor: undefined, limit: 20 });

    expect(tagRepository.list).toHaveBeenCalledWith({ cursor: undefined, limit: 20 });
    expect(result).toEqual({ items: [tag], nextCursor: null });
  });
});
