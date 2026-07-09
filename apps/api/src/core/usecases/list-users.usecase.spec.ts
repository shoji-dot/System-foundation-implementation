import type { User } from "../domain/user.entity";
import type { UserRepository } from "../domain/user.repository";

import { ListUsersUsecase } from "./list-users.usecase";

describe("ListUsersUsecase", () => {
  const user: User = {
    id: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    email: "user@example.com",
    passwordHash: "hashed",
    name: "User",
    locale: "ja",
    systemRole: "USER",
    plan: "FREE",
    profession: null,
    interestedJurisdictions: [],
    onboardingCompletedAt: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };

  function setup() {
    const userRepository: jest.Mocked<UserRepository> = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      updateRole: jest.fn(),
      updatePlan: jest.fn(),
      completeOnboarding: jest.fn(),
      updateProfile: jest.fn(),
    };
    const usecase = new ListUsersUsecase(userRepository);
    return { usecase, userRepository };
  }

  it("delegates listing to the repository and returns its result as-is", async () => {
    const { usecase, userRepository } = setup();
    userRepository.list.mockResolvedValue({ items: [user], nextCursor: null });

    const result = await usecase.execute({ cursor: undefined, limit: 20 });

    expect(userRepository.list).toHaveBeenCalledWith({ cursor: undefined, limit: 20 });
    expect(result).toEqual({ items: [user], nextCursor: null });
  });
});
