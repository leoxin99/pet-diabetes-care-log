import { describe, expect, it } from "vitest";
import { careArticles, isArticlePublishable, type CareArticle } from "./articles";

describe("care article publishing gate", () => {
  it("never publishes a draft", () => {
    expect(isArticlePublishable(careArticles[0], new Date("2026-07-17"))).toBe(false);
  });

  it("requires a current review window and reviewer", () => {
    const article: CareArticle = {
      ...careArticles[0], status: "reviewed", reviewer: "审核兽医 A",
      reviewedAt: "2026-07-01T00:00:00.000Z", nextReviewAt: "2027-01-01T00:00:00.000Z",
    };
    expect(isArticlePublishable(article, new Date("2026-07-17"))).toBe(true);
    expect(isArticlePublishable(article, new Date("2027-02-01"))).toBe(false);
  });
});
