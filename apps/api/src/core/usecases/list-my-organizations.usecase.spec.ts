import type { OrganizationMembership } from "../domain/membership.entity";
import type { MembershipRepository } from "../domain/membership.repository";

import { ListMyOrganizationsUsecase } from "./list-my-organizations.usecase";

describe("ListMyOrganizationsUsecase", () => {
  const membership: OrganizationMembership = {
    organizationId: "018f2c3a-70d1-7c9a-8b1e-5f2a1c9d3e4f",
    organizationName: "Acme Medical",
    organizationType: "MAKER",
    role: "ORG_ADMIN",
  };

  function setup() {
    const membershipRepository: jest.Mocked<MembershipRepository> = {
      findManyForUser: jest.fn(),
    };
    const usecase = new ListMyOrganizationsUsecase(membershipRepository);
    return { usecase, membershipRepository };
  }

  it("returns the memberships for the given user", async () => {
    const { usecase, membershipRepository } = setup();
    membershipRepository.findManyForUser.mockResolvedValue([membership]);

    const result = await usecase.execute("user-1");

    expect(membershipRepository.findManyForUser).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([membership]);
  });

  it("returns an empty array when the user belongs to no organization", async () => {
    const { usecase, membershipRepository } = setup();
    membershipRepository.findManyForUser.mockResolvedValue([]);

    const result = await usecase.execute("user-2");

    expect(result).toEqual([]);
  });
});
