import type { CommunityProfile, CommunityState, ContentReport, ModerationAction, Post, RiskFlag } from "./schema";

const patterns: Array<{ flag: RiskFlag; test: RegExp }> = [
  { flag: "treatment_change", test: /(加量|减量|停药|换药|调整.{0,8}(胰岛素|用药)|自行.{0,8}(调整|停用))/i },
  { flag: "specific_amount", test: /\d+(?:\.\d+)?\s*(?:u|iu|单位|毫克|mg)\b/i },
  { flag: "diagnosis_claim", test: /(可以确诊|肯定是.{0,10}(糖尿病|低血糖)|不用.{0,6}(看|联系).{0,4}兽医)/i },
  { flag: "urgent_symptom", test: /(昏迷|抽搐|无法站立|失去意识)/i },
  { flag: "contact_info", test: /(微信|vx|手机号|电话)\s*[:：]?\s*[a-z\d_-]{5,}/i },
];

export function detectRiskFlags(text: string) {
  return patterns.filter((pattern) => pattern.test.test(text)).map((pattern) => pattern.flag);
}

export function canModerate(profile: CommunityProfile) {
  return profile.role === "moderator" || profile.role === "admin";
}

export function publicPosts(state: CommunityState) {
  return state.posts.filter((post) => post.status === "approved").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function submitPost(state: CommunityState, draft: Pick<Post, "species" | "topic" | "title" | "body">) {
  const now = new Date().toISOString();
  const post: Post = {
    ...draft,
    id: crypto.randomUUID(), authorId: state.profile.id,
    status: "pending_review", riskFlags: detectRiskFlags(`${draft.title}\n${draft.body}`),
    createdAt: now, updatedAt: now, synthetic: false,
  };
  return { state: { ...state, posts: [...state.posts, post] }, post };
}

export function moderatePost(state: CommunityState, actor: CommunityProfile, postId: string, action: "approve" | "hide" | "reject", reason: string) {
  if (!canModerate(actor)) throw new Error("只有审核角色可以更改审核状态");
  const status = { approve: "approved", hide: "hidden", reject: "rejected" }[action] as Post["status"];
  const now = new Date().toISOString();
  const audit: ModerationAction = { id: crypto.randomUUID(), actorId: actor.id, targetType: "post", targetId: postId, action, reason, createdAt: now };
  return { ...state, posts: state.posts.map((post) => post.id === postId ? { ...post, status, updatedAt: now } : post), actions: [...state.actions, audit] };
}

export function deleteOwnPost(state: CommunityState, postId: string) {
  const post = state.posts.find((candidate) => candidate.id === postId);
  if (!post || post.authorId !== state.profile.id) throw new Error("只能删除自己的内容");
  const now = new Date().toISOString();
  const audit: ModerationAction = { id: crypto.randomUUID(), actorId: state.profile.id, targetType: "post", targetId: postId, action: "delete", reason: "作者主动删除", createdAt: now };
  return { ...state, posts: state.posts.map((candidate) => candidate.id === postId ? { ...candidate, status: "deleted" as const, updatedAt: now } : candidate), actions: [...state.actions, audit] };
}

export function reportContent(state: CommunityState, targetId: string, reason: ContentReport["reason"], detail?: string) {
  const now = new Date().toISOString();
  const report: ContentReport = { id: crypto.randomUUID(), reporterId: state.profile.id, targetType: "post", targetId, reason, detail, status: "open", createdAt: now };
  if (reason !== "medical_risk") return { ...state, reports: [...state.reports, report] };
  const audit: ModerationAction = { id: crypto.randomUUID(), actorId: "system-risk-gate", targetType: "post", targetId, action: "hide", reason: "收到高风险医学内容举报，立即隐藏待人工复核", createdAt: now };
  return {
    ...state,
    posts: state.posts.map((post) => post.id === targetId ? { ...post, status: "hidden" as const, updatedAt: now } : post),
    reports: [...state.reports, report], actions: [...state.actions, audit],
  };
}
