export type Role = "SEEKER" | "AGENT" | "ADMIN";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
  planStatus: string;
  planTier: string | null;
  planExpiresAt: string | null;
  subscribed: boolean;
};
export type ListingPurpose = "SALE" | "RENT";
export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "VILLA"
  | "PENTHOUSE"
  | "STUDIO"
  | "TOWNHOUSE"
  | "LAND"
  | "OTHER";
export type ListingStatus =
  | "DRAFT"
  | "REVIEW"
  | "LIVE"
  | "SOLD"
  | "RENTED"
  | "ARCHIVED";
export type PackageTier = "ESSENTIAL" | "PLUS" | "PREMIUM";
export type EnergyCert = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "PENDING";
export type InquiryStatus = "NEW" | "READ" | "REPLIED" | "CLOSED";
