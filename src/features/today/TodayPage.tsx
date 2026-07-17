import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useApp } from "../../app/AppContext";
import { Disclaimer } from "../../components/Disclaimer";
import { Modal } from "../../components/Modal";
import { formatDateTime, isTaskRecordedToday, isTaskScheduledToday, recordSummary, taskTypeLabels } from "../../domain/helpers";
import type { CareTask } from "../../domain/schema";
import { RecordForm, type RecordKind } from "../records/RecordForm";

const quickActions: { kind: RecordKind; icon: string; label: string; hint: string }[] = [
  { kind: "meal_treatment", icon: "餐", label: "进食与治疗", hint: "记录已发生的进食和治疗" },
  { kind: "glucose", icon: "糖", label: "血糖", hint: "保存读数与记录场景" },
  { kind: "weight", icon: "重", label: "体重", hint: "建立长期变化记录" },
  { kind: "observation", icon: "观", label: "今日状态", hint: "食欲、饮水、排尿与活动" },
];

export function TodayPage() {
  const { pet, petRecords, petTasks, storageError } = useApp();
  const [modal, setModal] = useState<{ kind: RecordKind; taskId?: string } | null>(null);
  const todayRecords = useMemo(() => petRecords
    .filter((record) => new Date(record.recordedAt).toDateString() === new Date().toDateString())
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)), [petRecords]);
  const tasks = petTasks.filter(isTaskScheduledToday).sort((a, b) => a.localTime.localeCompare(b.localTime));

  function openTask(task: CareTask) {
    const supported: RecordKind[] = ["meal_treatment", "glucose", "weight", "observation"];
    setModal({ kind: supported.includes(task.type as RecordKind) ? task.type as RecordKind : "all", taskId: task.id });
  }

  return (
    <div className="page stack-lg">
      <header className="hero">
        <div>
          <p className="eyebrow">{format(new Date(), "M月d日 EEEE")}</p>
          <h1>今天，陪 {pet?.name} 稳稳记录</h1>
          <p>只保存已经发生的照护事实，不必为了完成表单而猜测。</p>
        </div>
        <div className="today-count"><strong>{todayRecords.length}</strong><span>条今日记录</span></div>
      </header>
      {storageError && <div className="error-banner" role="alert">{storageError}</div>}

      <section>
        <div className="section-heading"><div><p className="eyebrow">TODAY</p><h2>今日计划</h2></div><a href="#/settings">管理计划</a></div>
        {tasks.length ? <div className="task-list">{tasks.map((task) => {
          const done = isTaskRecordedToday(task, petRecords);
          return <button className="task-row" key={task.id} onClick={() => openTask(task)}>
            <time>{task.localTime}</time><span className="task-main"><strong>{task.title}</strong><small>{taskTypeLabels[task.type]}</small></span>
            <span className={`status-pill ${done ? "done" : ""}`}>{done ? "已记录" : "尚未在本应用记录"}</span>
          </button>;
        })}</div> : <div className="empty-card"><p>还没有设置今日计划。</p><small>你可以依据兽医给出的照护方案，在设置中自行添加。</small><a className="button-link secondary" href="#/settings">去设置</a></div>}
      </section>

      <section>
        <div className="section-heading"><div><p className="eyebrow">QUICK LOG</p><h2>快速记录</h2></div></div>
        <div className="quick-grid">{quickActions.map((action) => <button className="quick-card" key={action.kind} onClick={() => setModal({ kind: action.kind })}>
          <span className="quick-icon">{action.icon}</span><strong>{action.label}</strong><small>{action.hint}</small>
        </button>)}</div>
      </section>

      <section>
        <div className="section-heading"><div><p className="eyebrow">TIMELINE</p><h2>今天的时间线</h2></div><a href="#/records">查看全部</a></div>
        {todayRecords.length ? <div className="timeline">{todayRecords.map((record) => <article className="timeline-item" key={record.id}>
          <time>{formatDateTime(record.recordedAt).split(" ")[1]}</time>
          <div><ul>{recordSummary(record).map((item) => <li key={item}>{item}</li>)}</ul></div>
        </article>)}</div> : <div className="empty-card"><p>今天还没有记录。</p><small>选择上方任一入口开始，数值字段都可以留空。</small></div>}
      </section>
      <Disclaimer compact />

      {modal && <Modal title={quickActions.find((item) => item.kind === modal.kind)?.label || "完整记录"} onClose={() => setModal(null)}>
        <RecordForm kind={modal.kind} taskId={modal.taskId} onSaved={() => setModal(null)} onCancel={() => setModal(null)} />
      </Modal>}
    </div>
  );
}
