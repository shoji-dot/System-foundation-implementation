import { Test } from "@nestjs/testing";
import type { TestingModule } from "@nestjs/testing";

import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ListQuizzesUsecase } from "../../core/usecases/list-quizzes.usecase";

import { QuizzesController } from "./quizzes.controller";

describe("QuizzesController", () => {
  let controller: QuizzesController;
  const listExecute = jest.fn();

  beforeEach(async () => {
    listExecute.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizzesController],
      providers: [{ provide: ListQuizzesUsecase, useValue: { execute: listExecute } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(QuizzesController);
  });

  describe("list", () => {
    it("maps the usecase result to response DTOs", async () => {
      listExecute.mockResolvedValue([
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
          lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
          title: "理解度確認",
          questions: [
            {
              id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e01",
              question: "薬機法の所管官庁はどこか？",
              choices: [
                { id: "a", text: "厚生労働省" },
                { id: "b", text: "経済産業省" },
              ],
              correctChoiceId: "a",
              explanation: "医薬品医療機器等法はPMDA/厚生労働省が所管する。",
              order: 0,
            },
          ],
        },
      ]);

      const result = await controller.list({
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
      });

      expect(listExecute).toHaveBeenCalledWith({
        lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
      });
      expect(result).toEqual({
        items: [
          {
            id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
            lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e00",
            title: "理解度確認",
            questions: [
              {
                id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e01",
                question: "薬機法の所管官庁はどこか？",
                choices: [
                  { id: "a", text: "厚生労働省" },
                  { id: "b", text: "経済産業省" },
                ],
                correctChoiceId: "a",
                explanation: "医薬品医療機器等法はPMDA/厚生労働省が所管する。",
                order: 0,
              },
            ],
          },
        ],
      });
    });

    it("returns an empty list when there are no matching quizzes", async () => {
      listExecute.mockResolvedValue([]);

      const result = await controller.list({});

      expect(result.items).toEqual([]);
    });
  });
});
