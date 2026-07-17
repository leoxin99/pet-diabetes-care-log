import { z } from "zod";
import type { Species } from "../../domain/src/schema";

export const careArticleSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  species: z.array(z.enum(["dog", "cat"])).min(1),
  topic: z.enum(["getting_started", "daily_observation", "home_records", "devices", "vet_visit", "urgent_contact"]),
  title: z.string().min(1).max(100),
  summary: z.string().max(300),
  bodyBlocks: z.array(z.string().min(1)).max(30),
  sources: z.array(z.object({
    title: z.string().min(1), url: z.string().url(), publisher: z.string().min(1), publishedAt: z.string().optional(),
  })).min(1),
  reviewer: z.string().min(1).optional(),
  reviewedAt: z.string().datetime().optional(),
  nextReviewAt: z.string().datetime().optional(),
  status: z.enum(["draft", "reviewed", "retired"]),
});

export type CareArticle = z.infer<typeof careArticleSchema>;

export function isArticlePublishable(article: CareArticle, now = new Date()) {
  if (article.status !== "reviewed" || !article.reviewer || !article.reviewedAt || !article.nextReviewAt) return false;
  return new Date(article.reviewedAt) <= now && new Date(article.nextReviewAt) >= now;
}

export const sourceDirectory = [
  {
    id: "aaha-cat-2026", species: ["cat"] as Species[], publisher: "AAHA", title: "2026 AAHA Diabetes Management Guidelines for Cats",
    url: "https://www.aaha.org/resources/2026-aaha-diabetes-management-guidelines-for-cats/",
  },
  {
    id: "aaha-dog-cat-2018", species: ["dog", "cat"] as Species[], publisher: "AAHA", title: "Diabetes Management Guidelines for Dogs and Cats",
    url: "https://www.aaha.org/resources/2018-aaha-diabetes-management-guideline-for-dogs-and-cats/",
  },
  {
    id: "msd-dog-cat", species: ["dog", "cat"] as Species[], publisher: "MSD Veterinary Manual", title: "Diabetes Mellitus in Dogs and Cats",
    url: "https://www.msdvetmanual.com/endocrine-system/the-pancreas/diabetes-mellitus-in-dogs-and-cats",
  },
  {
    id: "cornell-cat", species: ["cat"] as Species[], publisher: "Cornell University College of Veterinary Medicine", title: "Feline Diabetes",
    url: "https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/feline-diabetes",
  },
];

// 草稿只用于建立审核流程，不会出现在产品正文中。
export const careArticles: CareArticle[] = [
  {
    id: "draft-record-prep", slug: "record-prep", species: ["dog", "cat"], topic: "home_records",
    title: "家庭记录准备", summary: "待兽医逐条审核后发布。", bodyBlocks: ["未审核内容不展示。"],
    sources: [{ title: sourceDirectory[2].title, url: sourceDirectory[2].url, publisher: sourceDirectory[2].publisher }], status: "draft",
  },
];
