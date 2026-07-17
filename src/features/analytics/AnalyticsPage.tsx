import { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { format } from "date-fns";
import { useApp } from "../../app/AppContext";
import { Disclaimer } from "../../components/Disclaimer";
import { analyzeRecords, recordTypeLabels, recordsToAnalysisCsv, timeBucketLabels } from "../../domain/analytics";
import { recentRange, recordsInRange } from "../../domain/helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function AnalyticsPage() {
  const { state, pet } = useApp();
  const [days, setDays] = useState(30);
  const range = useMemo(() => recentRange(days), [days]);
  const records = useMemo(
    () => recordsInRange(state.records, range.start, range.end),
    [state.records, range],
  );
  const analytics = useMemo(
    () => analyzeRecords(records, range.start, range.end),
    [records, range],
  );
  const typeEntries = Object.entries(recordTypeLabels) as [keyof typeof recordTypeLabels, string][];
  const timeEntries = Object.entries(timeBucketLabels) as [keyof typeof timeBucketLabels, string][];
  const typeChart = {
    labels: typeEntries.map(([, label]) => label),
    datasets: [{ data: typeEntries.map(([key]) => analytics.recordTypeCounts[key]), backgroundColor: "#506b78", borderRadius: 5 }],
  };
  const timeChart = {
    labels: timeEntries.map(([, label]) => label),
    datasets: [{ data: timeEntries.map(([key]) => analytics.timeBucketCounts[key]), backgroundColor: "#c87653", borderRadius: 5 }],
  };

  function downloadCsv() {
    const blob = new Blob([recordsToAnalysisCsv(records)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pet?.name || "糖宠"}_${days}天记录分析_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const glucoseSummaries = Object.entries(analytics.glucoseByUnit).filter(([, summary]) => summary);

  return (
    <div className="page stack-lg">
      <header className="page-header">
        <p className="eyebrow">DATA PROFILE</p>
        <h1>记录数据分析</h1>
        <p>查看记录覆盖、字段完整性和原始数值摘要。这里只描述保存的数据，不设置医学阈值，也不解释病情。</p>
      </header>

      <section className="panel analytics-controls">
        <div className="segmented">{[7, 30, 90].map((value) => <button className={days === value ? "active" : ""} key={value} onClick={() => setDays(value)}>{value} 天</button>)}</div>
        <div className="range-caption">{format(range.start, "yyyy-MM-dd")} 至 {format(range.end, "yyyy-MM-dd")}</div>
        <button onClick={downloadCsv} disabled={!records.length}>导出当前范围 CSV</button>
      </section>

      <section className="analytics-metrics" aria-label="数据概览">
        <div><small>记录总数</small><strong>{analytics.totalRecords}</strong><span>条</span></div>
        <div><small>记录覆盖</small><strong>{analytics.coveredDays}/{analytics.rangeDays}</strong><span>{analytics.coverageRate}% 的日期</span></div>
        <div><small>有记录日均</small><strong>{analytics.averageRecordsPerCoveredDay}</strong><span>条 / 天</span></div>
        <div><small>数据维度</small><strong>{analytics.activeDimensions}</strong><span>类字段被使用</span></div>
      </section>

      <section>
        <div className="section-heading"><div><p className="eyebrow">QUALITY</p><h2>数据质量检查</h2></div></div>
        <div className="quality-list">{analytics.qualityChecks.map((check) => <article key={check.id} className={`quality-row ${check.status}`}>
          <div><strong>{check.label}</strong><p>{check.detail}</p></div><span>{check.value}</span>
        </article>)}</div>
      </section>

      <section className="analytics-grid">
        <div className="panel"><p className="eyebrow">DIMENSIONS</p><h2>记录类型分布</h2><div className="analytics-chart"><Bar data={typeChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} /></div></div>
        <div className="panel"><p className="eyebrow">TIME</p><h2>记录时段分布</h2><div className="analytics-chart"><Bar data={timeChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} /></div></div>
      </section>

      <section>
        <div className="section-heading"><div><p className="eyebrow">SUMMARY</p><h2>原始数值摘要</h2></div></div>
        {glucoseSummaries.length || analytics.weightSummary ? <div className="table-scroll"><table><thead><tr><th>字段</th><th>数量</th><th>最小记录值</th><th>最大记录值</th><th>平均记录值</th></tr></thead><tbody>
          {glucoseSummaries.map(([unit, summary]) => summary && <tr key={unit}><td>血糖（{unit}）</td><td>{summary.count}</td><td>{summary.minimum}</td><td>{summary.maximum}</td><td>{summary.average}</td></tr>)}
          {analytics.weightSummary && <tr><td>体重（kg）</td><td>{analytics.weightSummary.count}</td><td>{analytics.weightSummary.minimum}</td><td>{analytics.weightSummary.maximum}</td><td>{analytics.weightSummary.average}</td></tr>}
        </tbody></table></div> : <div className="empty-card"><p>当前范围没有可汇总的血糖或体重数值。</p></div>}
        <p className="analysis-note">最小、最大和平均值仅是所选记录的描述性统计，不代表目标范围或健康判断。不同血糖单位不会合并计算。</p>
      </section>

      <section className="panel data-pipeline"><p className="eyebrow">PROCESS</p><h2>数据处理链路</h2><ol><li>按时间范围筛选原始记录</li><li>按记录类型和单位分组</li><li>计算覆盖与字段完整性</li><li>生成描述性统计和 CSV</li><li>保留原始值供用户与兽医核对</li></ol></section>
      <Disclaimer />
    </div>
  );
}
