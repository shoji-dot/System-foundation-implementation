import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateTagUsecase } from "../../core/usecases/create-tag.usecase";
import { DeleteTagUsecase } from "../../core/usecases/delete-tag.usecase";
import { ListTagsUsecase } from "../../core/usecases/list-tags.usecase";
import { UpdateTagUsecase } from "../../core/usecases/update-tag.usecase";

import { TagsController } from "./tags.controller";

describe("TagsController", () => {
  let controller: TagsController;
  const listExecute = jest.fn();
  const createExecute = jest.fn();
  const updateExecute = jest.fn();
  const deleteExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    createExecute.mockReset();
    updateExecute.mockReset();
    deleteExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        { provide: ListTagsUsecase, useValue: { execute: listExecute } },
        { provide: CreateTagUsecase, useValue: { execute: createExecute } },
        { provide: UpdateTagUsecase, useValue: { execute: updateExecute } },
        { provide: DeleteTagUsecase, useValue: { execute: deleteExecute } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(TagsController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs, formatting date fields as ISO strings", async () => {
      listExecute.mockResolvedValue({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
            name: "薬機法",
            createdAt: new Date("2026-07-07T00:00:00.000Z"),
            updatedAt: new Date("2026-07-07T00:00:00.000Z"),
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      });

      const result = await controller.list({ cursor: undefined, limit: 20 });

      expect(listExecute).toHaveBeenCalledWith({ cursor: undefined, limit: 20 });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
            name: "薬機法",
            createdAt: "2026-07-07T00:00:00.000Z",
            updatedAt: "2026-07-07T00:00:00.000Z",
          },
        ],
        nextCursor: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
      });
    });
  });

  describe("create", () => {
    it("delegates to the usecase and returns the created tag", async () => {
      createExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        name: "新規タグ",
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.create({ name: "新規タグ" });

      expect(createExecute).toHaveBeenCalledWith({ name: "新規タグ" });
      expect(result.name).toBe("新規タグ");
    });
  });

  describe("update", () => {
    it("delegates to the usecase with the param id and body name", async () => {
      updateExecute.mockResolvedValue({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        name: "更新後タグ",
        createdAt: new Date("2026-07-07T00:00:00.000Z"),
        updatedAt: new Date("2026-07-07T00:00:00.000Z"),
      });

      const result = await controller.update(
        { id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" },
        { name: "更新後タグ" },
      );

      expect(updateExecute).toHaveBeenCalledWith({
        id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c",
        name: "更新後タグ",
      });
      expect(result.name).toBe("更新後タグ");
    });
  });

  describe("remove", () => {
    it("delegates to the usecase with the param id", async () => {
      deleteExecute.mockResolvedValue(undefined);

      await controller.remove({ id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c" });

      expect(deleteExecute).toHaveBeenCalledWith("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5c");
    });
  });
});
