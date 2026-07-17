import { z } from "zod";

export const communityRoleSchema = z.enum(["member", "moderator", "admin"]);
export const moderationStatusSchema = z.enum(["pending_review", "approved", "hidden", "rejected", "deleted"]);
export const riskFlagSchema = z.enum(["treatment_change", "specific_amount", "diagnosis_claim", "urgent_symptom", "contact_info"]);

export const communityProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).max(30),
  role: communityRoleSchema,
  joinedAt: z.string().datetime(),
});

export const postSchema = z.object({
  id: z.string().min(1), authorId: z.string().min(1),
  species: z.enum(["dog", "cat"]),
  topic: z.enum(["daily_care", "records", "vet_visit", "equipment", "emotional_support"]),
  title: z.string().min(4).max(80), body: z.string().min(10).max(2000),
  status: moderationStatusSchema,
  riskFlags: z.array(riskFlagSchema),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
  synthetic: z.boolean().default(false),
});

export const commentSchema = z.object({
  id: z.string().min(1), postId: z.string().min(1), authorId: z.string().min(1),
  body: z.string().min(2).max(800), status: moderationStatusSchema,
  riskFlags: z.array(riskFlagSchema), createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});

export const contentReportSchema = z.object({
  id: z.string().min(1), reporterId: z.string().min(1),
  targetType: z.enum(["post", "comment"]), targetId: z.string().min(1),
  reason: z.enum(["medical_risk", "privacy", "harassment", "spam", "other"]),
  detail: z.string().max(500).optional(), status: z.enum(["open", "resolved", "dismissed"]),
  createdAt: z.string().datetime(),
});

export const moderationActionSchema = z.object({
  id: z.string().min(1), actorId: z.string().min(1),
  targetType: z.enum(["post", "comment", "profile"]), targetId: z.string().min(1),
  action: z.enum(["approve", "hide", "reject", "delete", "restore", "ban"]),
  reason: z.string().min(1).max(500), createdAt: z.string().datetime(),
});

export type CommunityProfile = z.infer<typeof communityProfileSchema>;
export type Post = z.infer<typeof postSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type ContentReport = z.infer<typeof contentReportSchema>;
export type ModerationAction = z.infer<typeof moderationActionSchema>;
export type RiskFlag = z.infer<typeof riskFlagSchema>;

export interface CommunityState {
  profile: CommunityProfile;
  posts: Post[];
  comments: Comment[];
  reports: ContentReport[];
  actions: ModerationAction[];
  favoritePostIds: string[];
}
