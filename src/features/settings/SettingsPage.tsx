import { useRef, useState, type FormEvent } from "react";
import { useApp } from "../../app/AppContext";
import { Disclaimer } from "../../components/Disclaimer";
import { careTaskSchema, petProfileSchema, type CareTask, type GlucoseUnit } from "../../domain/schema";
import { taskTypeLabels } from "../../domain/helpers";
import { createDemoBundle } from "../../demo/data";
import { downloadBundle, parseImport, type StorageError } from "../../storage/repository";

const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];

function repeatLabel(days: number[]) {
  return days.length === 7 ? "每天" : `周${days.map((day) => weekdayNames[day]).join("、")}`;
}

export function SettingsPage() {
  const { state, pet, dispatch } = useApp();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(pet?.name || "");
  const [breed, setBreed] = useState(pet?.breed || "");
  const [unit, setUnit] = useState<GlucoseUnit>(pet?.defaultGlucoseUnit || "mg/dL");
  const [vetName, setVetName] = useState(pet?.vetName || "");
  const [vetContact, setVetContact] = useState(pet?.vetContact || "");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("08:00");
  const [taskType, setTaskType] = useState<CareTask["type"]>("meal_insulin");
  const [repeatDays, setRepeatDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [message, setMessage] = useState("");

  function savePet(event: FormEvent) {
    event.preventDefault();
    if (!pet) return;
    const result = petProfileSchema.safeParse({
      ...pet, name, breed: breed || undefined, defaultGlucoseUnit: unit,
      vetName: vetName || undefined, vetContact: vetContact || undefined, updatedAt: new Date().toISOString(),
    });
    if (!result.success) return setMessage(result.error.issues[0].message);
    dispatch({ type: "savePet", pet: result.data });
    setMessage("档案已保存。历史记录中的单位不会改变。");
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    if (!pet) return;
    const now = new Date().toISOString();
    const result = careTaskSchema.safeParse({
      id: crypto.randomUUID(), petId: pet.id, type: taskType, title: taskTitle,
      localTime: taskTime, repeatDays, enabled: true, createdAt: now, updatedAt: now,
    });
    if (!result.success) return setMessage(result.error.issues[0].message);
    dispatch({ type: "saveTask", task: result.data });
    setTaskTitle("");
    setMessage("计划已添加，仅在应用内展示。");
  }

  async function importFile(file?: File) {
    if (!file) return;
    try {
      const bundle = parseImport(await file.text());
      const preview = `${bundle.pets.length} 个档案、${bundle.records.length} 条记录、${bundle.tasks.length} 个计划`;
      if (!window.confirm(`文件校验通过，包含 ${preview}。\n\n继续前会先下载当前数据备份，然后用导入数据替换当前数据。是否继续？`)) return;
      downloadBundle(state, "糖宠照护-导入前备份.json");
      dispatch({ type: "replace", bundle });
      setMessage(`导入完成：${preview}。`);
    } catch (error) {
      setMessage((error as StorageError).message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function clearAll() {
    if (!window.confirm("将先下载当前备份，再清空全部档案、记录和计划。清空后应用会返回首次使用流程。是否继续？")) return;
    downloadBundle(state, "糖宠照护-清空前备份.json");
    dispatch({ type: "clear" });
  }

  return (
    <div className="page stack-lg">
      <header className="page-header"><p className="eyebrow">SETTINGS</p><h1>设置与数据</h1><p>你的记录只保存在当前浏览器。请定期导出备份。</p></header>
      {message && <div className="info-banner" role="status">{message}</div>}
      <section className="panel"><h2>宠物档案</h2><form className="stack" onSubmit={savePet}>
        <div className="form-grid"><label>小狗名字<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>品种（可选）<input value={breed} onChange={(e) => setBreed(e.target.value)} /></label>
          <label>默认血糖单位<select value={unit} onChange={(e) => setUnit(e.target.value as GlucoseUnit)}><option>mg/dL</option><option>mmol/L</option></select></label>
          <label>兽医/机构（可选）<input value={vetName} onChange={(e) => setVetName(e.target.value)} /></label><label>联系方式（可选）<input value={vetContact} onChange={(e) => setVetContact(e.target.value)} /></label></div>
        <button>保存档案</button>
      </form></section>
      <section className="panel"><h2>照护计划</h2><p className="muted">计划由你依据兽医给出的方案填写，只生成应用内入口，不发送系统通知。</p>
        {state.tasks.length ? <div className="task-list settings-tasks">{state.tasks.map((task) => <div className="task-row static" key={task.id}><time>{task.localTime}</time><span className="task-main"><strong>{task.title}</strong><small>{taskTypeLabels[task.type]} · {repeatLabel(task.repeatDays)}</small></span><button className="text-button destructive" onClick={() => dispatch({ type: "deleteTask", id: task.id })}>删除</button></div>)}</div> : <p className="muted">暂无计划。</p>}
        <form className="form-grid task-form" onSubmit={addTask}>
          <label>事项名称<input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="例如：晚间照护记录" required /></label>
          <label>类型<select value={taskType} onChange={(e) => setTaskType(e.target.value as CareTask["type"])}>{Object.entries(taskTypeLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>时间<input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} required /></label>
          <div className="weekday-field"><span className="field-label">重复星期</span><div className="weekday-grid">{weekdayNames.map((label, day) => <label className={repeatDays.includes(day) ? "selected" : ""} key={label}><input type="checkbox" checked={repeatDays.includes(day)} onChange={() => setRepeatDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort())} />{label}</label>)}</div></div>
          <button>添加计划</button>
        </form>
      </section>
      <section className="panel"><h2>备份与恢复</h2><div className="data-actions">
        <button onClick={() => downloadBundle(state)}>导出完整 JSON</button>
        <button className="secondary" onClick={() => fileInput.current?.click()}>导入 JSON</button>
        <input ref={fileInput} hidden type="file" accept="application/json,.json" onChange={(e) => importFile(e.target.files?.[0])} />
        <button className="secondary" onClick={() => { if (window.confirm("将用明确标注的合成演示数据替换当前数据。继续前建议先导出备份。是否继续？")) dispatch({ type: "replace", bundle: createDemoBundle() }); }}>加载合成 Demo</button>
        <button className="destructive-button" onClick={clearAll}>备份并清空</button>
      </div><p className="muted">导入流程会先完整校验 schema v0.3，不兼容或损坏的文件不会覆盖当前数据。</p></section>
      <section className="panel"><h2>产品边界与隐私</h2><Disclaimer /><ul className="plain-list"><li>无账号、无云端同步、无广告和分析 SDK。</li><li>不会根据数值判断病情或生成治疗结论。</li><li>不会自动采集检测仪、图片或设备数据。</li><li>若宠物出现紧急不适，请立即联系兽医或动物急诊。</li></ul></section>
    </div>
  );
}
