import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { useApp } from "../../app/AppContext";
import { Disclaimer } from "../../components/Disclaimer";
import { recordSummary, recentRange, selectRecords, speciesLabels } from "../../domain/helpers";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function ReportsPage() {
  const { petRecords, pet } = useApp();
  const [days, setDays] = useState(14);
  const [custom, setCustom] = useState(false);
  const [customStart, setCustomStart] = useState(format(recentRange(14).start, "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [questions, setQuestions] = useState("");
  const range = custom
    ? { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T23:59:59`) }
    : recentRange(days);
  const records = useMemo(() => {
    const selectedRange = custom
      ? { start: new Date(`${customStart}T00:00:00`), end: new Date(`${customEnd}T23:59:59`) }
      : recentRange(days);
    return selectRecords(petRecords, selectedRange);
  }, [petRecords, days, custom, customStart, customEnd]);
  const coveredDays = new Set(records.map((record) => format(parseISO(record.recordedAt), "yyyy-MM-dd"))).size;
  const glucoseCount = records.filter((record) => record.glucose).length;
  const weightCount = records.filter((record) => record.weightKg !== undefined).length;
  const glucoseRecords = [...records].reverse().filter((record) => record.glucose);
  const glucoseChart = {
    labels: glucoseRecords.map((record) => format(parseISO(record.recordedAt), "MM-dd HH:mm")),
    datasets: [{
      label: "血糖原始记录",
      data: glucoseRecords.map((record) => record.glucose?.value),
      borderColor: "#506b78",
      backgroundColor: "#506b78",
      tension: 0.2,
      pointRadius: 3,
    }],
  };

  return (
    <div className="page stack-lg">
      <header className="page-header no-print"><p className="eyebrow">VET REPORT</p><h1>复诊报告</h1><p>选择时间范围，生成只包含记录事实和用户备注的打印材料。</p></header>
      <section className="report-controls no-print panel">
        <div className="segmented">{[7,14,30].map((value) => <button className={!custom && days === value ? "active" : ""} key={value} onClick={() => { setDays(value); setCustom(false); }}>{value} 天</button>)}<button className={custom ? "active" : ""} onClick={() => setCustom(true)}>自定义</button></div>
        {custom && <div className="form-grid"><label>开始日期<input type="date" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} /></label><label>结束日期<input type="date" value={customEnd} min={customStart} onChange={(e) => setCustomEnd(e.target.value)} /></label></div>}
        <label>准备向兽医确认的问题<textarea rows={3} value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="由你自己填写，产品不会生成医疗问题或结论" /></label>
        <button onClick={() => window.print()}>打印 / 保存 PDF</button>
      </section>
      <article className="report-sheet">
        <header className="report-title"><div><p className="eyebrow">糖宠照护 · 用户记录</p><h1>{pet?.name} 的复诊沟通记录</h1></div><span>生成于 {format(new Date(), "yyyy-MM-dd HH:mm")}</span></header>
        <div className="report-meta">
          <div><small>记录区间</small><strong>{format(range.start, "yyyy-MM-dd")} 至 {format(range.end, "yyyy-MM-dd")}</strong></div>
          <div><small>记录覆盖</small><strong>{coveredDays} 天 / {records.length} 条</strong></div>
          <div><small>血糖记录</small><strong>{glucoseCount} 条</strong></div>
          <div><small>体重记录</small><strong>{weightCount} 条</strong></div>
        </div>
        <section><h2>宠物档案摘要</h2><p>姓名：{pet?.name} · 物种：{pet ? speciesLabels[pet.species] : "未填写"} · 品种：{pet?.breed || "未填写"} · 默认血糖单位：{pet?.defaultGlucoseUnit}</p>{pet?.vetName && <p>兽医/机构：{pet.vetName} · 联系方式：{pet.vetContact || "未填写"}</p>}</section>
        {glucoseRecords.length >= 2 && <section className="report-chart-section"><h2>血糖记录图（原始值）</h2><p className="chart-note">图表仅展示所选区间内的用户记录值，不解释医学意义。</p><div className="report-chart"><Line data={glucoseChart} options={{ responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }} /></div></section>}
        <section><h2>记录时间线</h2>
          {records.length ? <table><thead><tr><th>时间</th><th>用户记录事实与备注</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{format(parseISO(record.recordedAt), "MM-dd HH:mm")}</td><td>{recordSummary(record).map((item) => <div key={item}>{item}</div>)}</td></tr>)}</tbody></table>
            : <p className="muted">所选区间没有记录。</p>}
        </section>
        {questions.trim() && <section><h2>用户准备向兽医确认的问题</h2><p className="pre-wrap">{questions}</p></section>}
        <Disclaimer />
      </article>
    </div>
  );
}
