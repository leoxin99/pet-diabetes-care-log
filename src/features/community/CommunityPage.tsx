import { type FormEvent, useMemo, useState } from "react";
import type { Post } from "../../community/schema";
import { deleteOwnPost, publicPosts, reportContent, submitPost } from "../../community/moderation";
import { loadCommunityState, saveCommunityState } from "../../community/repository";

const topicLabels: Record<Post["topic"], string> = {
  daily_care: "日常照护", records: "记录方法", vet_visit: "复诊准备", equipment: "设备经验", emotional_support: "互相支持",
};

export function CommunityPage() {
  const [state, setState] = useState(loadCommunityState);
  const [species, setSpecies] = useState<"all" | "dog" | "cat">("all");
  const [topic, setTopic] = useState<"all" | Post["topic"]>("all");
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState<Pick<Post, "species" | "topic" | "title" | "body">>({ species: "dog", topic: "daily_care", title: "", body: "" });
  const visible = useMemo(() => publicPosts(state).filter((post) => (species === "all" || post.species === species) && (topic === "all" || post.topic === topic)), [state, species, topic]);
  const pending = state.posts.filter((post) => post.authorId === state.profile.id && post.status === "pending_review");

  const replace = (next: typeof state) => { setState(saveCommunityState(next)); };
  const create = (event: FormEvent) => {
    event.preventDefault();
    const result = submitPost(state, draft);
    replace(result.state);
    setDraft({ ...draft, title: "", body: "" }); setShowComposer(false);
  };
  const toggleFavorite = (postId: string) => replace({ ...state, favoritePostIds: state.favoritePostIds.includes(postId) ? state.favoritePostIds.filter((id) => id !== postId) : [...state.favoritePostIds, postId] });

  return <div className="page stack-lg">
    <header className="page-header"><p className="eyebrow">INVITE-ONLY GOVERNANCE PROTOTYPE</p><h1>家长互助社区</h1><p>先验证结构化经验交流、审核和举报流程。当前是本机前端原型，没有真实账号、云端发布或公开注册。</p></header>
    <div className="disclaimer">社区经验不能替代专业资料或线下兽医判断。请不要填写宠物姓名、联系方式、具体治疗量或原始健康时间线。</div>
    <section className="panel community-toolbar">
      <div className="filter-row">
        {(["all", "dog", "cat"] as const).map((value) => <button className={`filter-chip ${species === value ? "active" : ""}`} onClick={() => setSpecies(value)} key={value}>{value === "all" ? "犬猫全部" : value === "dog" ? "犬" : "猫"}</button>)}
      </div>
      <label>主题<select value={topic} onChange={(event) => setTopic(event.target.value as typeof topic)}><option value="all">全部主题</option>{Object.entries(topicLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button onClick={() => setShowComposer(true)}>发布脱敏经验</button>
    </section>

    {pending.length > 0 && <section><div className="section-heading"><div><p className="eyebrow">MY PENDING</p><h2>我的待审内容</h2></div><small>审核前不会出现在公开列表</small></div><div className="record-list">{pending.map((post) => <article className="record-card" key={post.id}><div className="record-head"><strong>{post.title}</strong><span className="status-pill">待人工审核</span></div>{post.riskFlags.length > 0 && <p className="muted">系统标记：{post.riskFlags.join("、")}</p>}<button className="text-button destructive" onClick={() => replace(deleteOwnPost(state, post.id))}>删除自己的内容</button></article>)}</div></section>}

    <section><div className="section-heading"><div><p className="eyebrow">APPROVED ONLY</p><h2>已审核经验帖</h2></div><small>按时间排序，无算法推荐</small></div><div className="community-grid">{visible.map((post) => <article className="panel community-post" key={post.id}><div><span className="chip">{post.species === "dog" ? "犬" : "猫"}</span><span className="chip">{topicLabels[post.topic]}</span>{post.synthetic && <span className="chip">合成示例</span>}</div><h3>{post.title}</h3><p>{post.body}</p><div className="community-actions"><button className="secondary" onClick={() => toggleFavorite(post.id)}>{state.favoritePostIds.includes(post.id) ? "已收藏" : "收藏"}</button><button className="secondary" onClick={() => { if (window.confirm("确认举报为高风险医学内容并立即隐藏待审？")) replace(reportContent(state, post.id, "medical_risk")); }}>医学风险举报</button></div></article>)}</div>{visible.length === 0 && <div className="empty-card"><p>当前筛选下没有已审核内容</p><small>待审内容不会提前公开。</small></div>}</section>

    <section className="panel"><h2>公开注册前仍需完成</h2><ul className="plain-list"><li>确认社区运营 Owner、审核值班和 24 小时处理机制。</li><li>接入云函数权限校验、文本与图片安全检查、图片 EXIF 移除。</li><li>完成主体、类目、备案、隐私指引与平台审核。</li></ul></section>

    {showComposer && <div className="modal-backdrop"><form className="modal stack" onSubmit={create}><div className="modal-header"><h2>发布脱敏经验</h2><button type="button" className="icon-button" onClick={() => setShowComposer(false)}>×</button></div><div className="form-grid"><label>物种<select value={draft.species} onChange={(event) => setDraft({ ...draft, species: event.target.value as Post["species"] })}><option value="dog">犬</option><option value="cat">猫</option></select></label><label>主题<select value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value as Post["topic"] })}>{Object.entries(topicLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label>标题<input minLength={4} maxLength={80} required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>脱敏经验摘要<textarea minLength={10} maxLength={2000} rows={8} required value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label><div className="info-banner">提交后统一进入人工审核；涉及治疗调整、具体治疗量、诊断结论、紧急症状或联系方式的内容会被额外标记。</div><div className="button-row"><button type="button" className="secondary" onClick={() => setShowComposer(false)}>取消</button><button type="submit">提交审核</button></div></form></div>}
  </div>;
}
