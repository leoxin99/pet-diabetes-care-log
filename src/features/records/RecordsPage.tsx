import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { format, parseISO } from "date-fns";
import { useApp } from "../../app/AppContext";
import { Modal } from "../../components/Modal";
import { formatDateTime, recordSummary, recentRange, selectRecords } from "../../domain/helpers";
import type { CareRecord } from "../../domain/schema";
import { RecordForm } from "./RecordForm";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Metric = "glucose" | "weight";

export function RecordsPage() {
  const { petRecords, dispatch } = useApp();
  const [days, setDays] = useState(30);
  const [custom, setCustom] = useState(false);
  const [customStart, setCustomStart] = useState(format(recentRange(30).start, "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [metric, setMetric] = useState<Metric>("glucose");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<CareRecord | null>(null);
  const [undo, setUndo] = useState<CareRecord | null>(null);
  const inRange = useMemo(() => {
    const selectedRange = custom
      ? { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T23:59:59`) }
      : recentRange(days);
    return selectRecords(petRecords, selectedRange);
  }, [petRecords, days, custom, customStart, customEnd]);
  const filtered = inRange.filter((record) => filter === "all" ||
    (filter === "glucose" && record.glucose) ||
    (filter === "meal" && (record.meal || record.treatments?.length)) ||
    (filter === "weight" && record.weightKg !== undefined) ||
    (filter === "observation" && record.dailyObservation));
  const chartRecords = [...inRange].reverse().filter((record) => metric === "glucose" ? record.glucose : record.weightKg !== undefined);
  const data = {
    labels: chartRecords.map((record) => format(parseISO(record.recordedAt), "MM-dd HH:mm")),
    datasets: [{
      label: metric === "glucose" ? "血糖原始记录" : "体重原始记录",
      data: chartRecords.map((record) => metric === "glucose" ? record.glucose?.value : record.weightKg),
      borderColor: "#506b78", backgroundColor: "#506b78", tension: 0.2, pointRadius: 4,
    }],
  };

  function remove(record: CareRecord) {
    if (!window.confirm("确定删除这条记录吗？删除后可在当前页面撤销一次。")) return;
    if (dispatch({ type: "deleteRecord", id: record.id })) setUndo(record);
  }

  return (
    <div className="page stack-lg">
      <header className="page-header"><p className="eyebrow">RECORDS</p><h1>记录与趋势</h1><p>趋势图只呈现你保存的原始数值，不解释医学意义。</p></header>
      <section className="panel">
        <div className="toolbar">
          <div className="segmented">{[7,30,90].map((value) => <button className={!custom && days === value ? "active" : ""} key={value} onClick={() => { setDays(value); setCustom(false); }}>{value} 天</button>)}<button className={custom ? "active" : ""} onClick={() => setCustom(true)}>自定义</button></div>
          <div className="segmented"><button className={metric === "glucose" ? "active" : ""} onClick={() => setMetric("glucose")}>血糖</button><button className={metric === "weight" ? "active" : ""} onClick={() => setMetric("weight")}>体重</button></div>
        </div>
        {custom && <div className="form-grid date-range"><label>开始日期<input type="date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} /></label><label>结束日期<input type="date" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)} /></label></div>}
        {chartRecords.length >= 2 ? <div className="chart-wrap"><Line data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }} /></div>
          : <div className="empty-card"><p>暂无足够记录</p><small>至少保存两个对应数值后才显示连线；不会基于单点推断趋势。</small></div>}
        {chartRecords.length > 0 && <div className="table-scroll"><table><thead><tr><th>时间</th><th>{metric === "glucose" ? "血糖" : "体重"}</th><th>说明</th></tr></thead><tbody>{chartRecords.map((record) => <tr key={record.id}><td>{formatDateTime(record.recordedAt)}</td><td>{metric === "glucose" ? `${record.glucose?.value} ${record.glucose?.unit}` : `${record.weightKg} kg`}</td><td>{metric === "glucose" ? recordSummary(record)[0] : "用户记录值"}</td></tr>)}</tbody></table></div>}
      </section>
      <section>
        <div className="section-heading"><div><p className="eyebrow">HISTORY</p><h2>历史记录</h2></div><button onClick={() => setEditing({} as CareRecord)}>新增完整记录</button></div>
        <div className="filter-row">{[["all","全部"],["glucose","血糖"],["meal","进食/治疗"],["weight","体重"],["observation","状态"]].map(([value,label]) => <button className={`filter-chip ${filter === value ? "active" : ""}`} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        {filtered.length ? <div className="record-list">{filtered.map((record) => <article className="record-card" key={record.id}>
          <div className="record-head"><time>{formatDateTime(record.recordedAt)}</time><div><button className="text-button" onClick={() => setEditing(record)}>编辑</button><button className="text-button destructive" onClick={() => remove(record)}>删除</button></div></div>
          <ul>{recordSummary(record).map((item) => <li key={item}>{item}</li>)}</ul>
        </article>)}</div> : <div className="empty-card"><p>当前范围没有匹配记录。</p></div>}
      </section>
      {undo && <div className="toast">记录已删除。<button onClick={() => { dispatch({ type: "restoreRecord", record: undo }); setUndo(null); }}>撤销</button><button aria-label="关闭" onClick={() => setUndo(null)}>×</button></div>}
      {editing && <Modal title={editing.id ? "编辑记录" : "新增完整记录"} onClose={() => setEditing(null)}><RecordForm kind="all" existing={editing.id ? editing : undefined} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} /></Modal>}
    </div>
  );
}
