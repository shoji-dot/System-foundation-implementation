import type { ProgressRepository } from "../domain/progress.repository";

import { ListLearningProgressUsecase } from "./list-learning-progress.usecase";

describe("ListLearningProgressUsecase", () => {
  function setup() {
    const progressRepository: jest.Mocked<ProgressRepository> = {
      upsert: jest.fn(),
      getSummaryForUser: jest.fn(),
      findManyByUserId: jest.fn(),
    };
    const usecase = new ListLearningProgressUsecase(progressRepository);
    return { usecase, progressRepository };
  }

  it("delegates to the repository scoped to the given userId", async () => {
    const { usecase, progressRepository } = setup();
    const expected = {
      items: [
        {
          id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6a",
          lessonId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6b",
          status: "COMPLETED" as const,
          score: 80,
          completedAt: new Date("2026-07-06T00:00:00.000Z"),
          lessonTitle: "薬機法の基礎",
          courseId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e6c",
          courseTitle: "企画・開発",
        },
      ],
      nextCursor: null,
    };
    progressRepository.findManyByUserId.mockResolvedValue(expected);

    const result = await usecase.execute({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      cursor: undefined,
      limit: 20,
    });

    expect(progressRepository.findManyByUserId).toHaveBeenCalledWith({
      userId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
      cursor: undefined,
      limit: 20,
    });
    expect(result).toEqual(expected);
  });
});
