import type { ProgressRepository } from "../domain/progress.repository";

import { GetLearningProgressSummaryUsecase } from "./get-learning-progress-summary.usecase";

describe("GetLearningProgressSummaryUsecase", () => {
  function setup() {
    const progressRepository: jest.Mocked<ProgressRepository> = {
      upsert: jest.fn(),
      getSummaryForUser: jest.fn(),
      findManyByUserId: jest.fn(),
    };
    const usecase = new GetLearningProgressSummaryUsecase(progressRepository);
    return { usecase, progressRepository };
  }

  it("delegates to the repository with the given userId", async () => {
    const { usecase, progressRepository } = setup();
    const expected = { totalLessons: 10, completedCount: 3, inProgressCount: 2 };
    progressRepository.getSummaryForUser.mockResolvedValue(expected);

    const result = await usecase.execute("018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b");

    expect(progressRepository.getSummaryForUser).toHaveBeenCalledWith(
      "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e5b",
    );
    expect(result).toEqual(expected);
  });
});
