import { describe, expect, it } from "vitest";
import { deleteOwnPost, detectRiskFlags, moderatePost, publicPosts, reportContent, submitPost } from "./moderation";
import { initialCommunityState } from "./repository";

describe("community moderation gate", () => {
  it("routes every new post to review and detects medical-risk language", () => {
    const result = submitPost(initialCommunityState(), { species: "cat", topic: "daily_care", title: "想分享一个做法", body: "我打算自行调整胰岛素并增加 2 IU。" });
    expect(result.post.status).toBe("pending_review");
    expect(result.post.riskFlags).toEqual(expect.arrayContaining(["treatment_change", "specific_amount"]));
    expect(publicPosts(result.state)).not.toContainEqual(result.post);
  });

  it("does not grant moderation to an ordinary member", () => {
    const state = initialCommunityState();
    expect(() => moderatePost(state, state.profile, state.posts[0].id, "approve", "test")).toThrow("只有审核角色");
  });

  it("immediately hides a reported medical-risk post and records an audit action", () => {
    const state = initialCommunityState();
    const next = reportContent(state, state.posts[0].id, "medical_risk");
    expect(publicPosts(next).some((post) => post.id === state.posts[0].id)).toBe(false);
    expect(next.actions.at(-1)?.action).toBe("hide");
  });

  it("allows authors to delete only their own posts", () => {
    const result = submitPost(initialCommunityState(), { species: "dog", topic: "records", title: "我的记录方法", body: "这是一个等待审核的脱敏经验摘要。" });
    expect(deleteOwnPost(result.state, result.post.id).posts.at(-1)?.status).toBe("deleted");
    expect(() => deleteOwnPost(initialCommunityState(), "synthetic-post-dog")).toThrow("只能删除自己的内容");
  });

  it("flags urgent symptoms and contact details", () => {
    expect(detectRiskFlags("宠物出现抽搐，请加微信 abc12345")).toEqual(expect.arrayContaining(["urgent_symptom", "contact_info"]));
  });
});
