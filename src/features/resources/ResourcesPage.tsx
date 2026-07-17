import { useMemo, useState } from "react";
import { useApp } from "../../app/AppContext";
import { careArticles, isArticlePublishable, sourceDirectory } from "../../content/articles";
import { Disclaimer } from "../../components/Disclaimer";
import type { Species } from "../../domain/schema";

export function ResourcesPage() {
  const { pet } = useApp();
  const [species, setSpecies] = useState<Species>(pet?.species || "dog");
  const articles = useMemo(() => careArticles.filter((article) => article.species.includes(species) && isArticlePublishable(article)), [species]);
  const sources = sourceDirectory.filter((source) => source.species.includes(species));

  return <div className="page stack-lg">
    <header className="page-header"><p className="eyebrow">CARE LIBRARY</p><h1>照护资料</h1><p>资料按物种区分、标注来源并经过审核门禁；不会根据你的记录生成治疗建议。</p></header>
    <section className="panel resource-gate"><div className="segmented"><button className={species === "dog" ? "active" : ""} onClick={() => setSpecies("dog")}>犬</button><button className={species === "cat" ? "active" : ""} onClick={() => setSpecies("cat")}>猫</button></div><p className="muted">当前选择：{species === "dog" ? "犬" : "猫"}。犬猫资料不会混为同一套治疗流程。</p></section>
    <section><div className="section-heading"><div><p className="eyebrow">REVIEWED</p><h2>已审核资料</h2></div></div>
      {articles.length ? <div className="resource-grid">{articles.map((article) => <article className="panel" key={article.id}><h3>{article.title}</h3><p>{article.summary}</p><small>审核：{article.reviewer} · 下次复审：{article.nextReviewAt?.slice(0, 10)}</small></article>)}</div> : <div className="empty-card"><p>首批中文资料仍在等待兽医逐条审核。</p><small>审核完成前不会把草稿标记为专业内容，也不会展示剂量表或治疗决策。</small></div>}
    </section>
    <section><div className="section-heading"><div><p className="eyebrow">SOURCES</p><h2>权威来源导航</h2></div></div><div className="resource-grid">{sources.map((source) => <article className="panel" key={source.id}><small>{source.publisher}</small><h3>{source.title}</h3><a href={source.url} target="_blank" rel="noreferrer">查看原始来源</a></article>)}</div><p className="analysis-note">外部来源用于继续阅读，不代表本产品已完成中文医学内容审核。</p></section>
    <Disclaimer />
  </div>;
}
