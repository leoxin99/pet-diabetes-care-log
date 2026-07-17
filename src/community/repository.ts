import { z } from "zod";
import type { CommunityState } from "./schema";
import { commentSchema, communityProfileSchema, contentReportSchema, moderationActionSchema, postSchema } from "./schema";

const STORAGE_KEY = "sugarpet-community-governance-prototype:v0.7";
const stateSchema = z.object({
  profile: communityProfileSchema, posts: z.array(postSchema), comments: z.array(commentSchema),
  reports: z.array(contentReportSchema), actions: z.array(moderationActionSchema), favoritePostIds: z.array(z.string()),
});

export function initialCommunityState(): CommunityState {
  const now = "2026-07-17T08:00:00.000Z";
  return {
    profile: { id: "prototype-member", displayName: "邀请测试成员", role: "member", joinedAt: now },
    posts: [
      { id: "synthetic-post-dog", authorId: "synthetic-parent-a", species: "dog", topic: "records", title: "复诊前我是怎样整理记录的", body: "我会先检查哪些日期有记录，再把想问兽医的问题单独写下来。这里展示的是合成示例，不是真实照护经历。", status: "approved", riskFlags: [], createdAt: now, updatedAt: now, synthetic: true },
      { id: "synthetic-post-cat", authorId: "synthetic-parent-b", species: "cat", topic: "emotional_support", title: "第一次开始记录时，我先做了很小的一步", body: "我只从当天的一次进食观察开始，慢慢熟悉记录流程。这里展示的是合成示例，不是真实照护经历。", status: "approved", riskFlags: [], createdAt: "2026-07-17T07:00:00.000Z", updatedAt: "2026-07-17T07:00:00.000Z", synthetic: true },
    ],
    comments: [], reports: [], actions: [], favoritePostIds: [],
  };
}

export function loadCommunityState(storage: Storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return initialCommunityState();
  const parsed = stateSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : initialCommunityState();
}

export function saveCommunityState(state: CommunityState, storage: Storage = localStorage) {
  const parsed = stateSchema.parse(state);
  storage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}
