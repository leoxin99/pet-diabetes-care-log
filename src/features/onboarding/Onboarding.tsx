import { useState, type FormEvent } from "react";
import { useApp } from "../../app/AppContext";
import { Disclaimer } from "../../components/Disclaimer";
import { careTaskSchema, petProfileSchema, type GlucoseUnit } from "../../domain/schema";

export function Onboarding() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [unit, setUnit] = useState<GlucoseUnit>("mg/dL");
  const [addTasks, setAddTasks] = useState(false);
  const [morning, setMorning] = useState("08:00");
  const [evening, setEvening] = useState("20:00");
  const [error, setError] = useState("");

  function finish(event: FormEvent) {
    event.preventDefault();
    const now = new Date().toISOString();
    const petId = crypto.randomUUID();
    const petResult = petProfileSchema.safeParse({
      id: petId, name, species: "dog", breed: breed || undefined,
      defaultGlucoseUnit: unit, createdAt: now, updatedAt: now,
    });
    if (!petResult.success) {
      setError(petResult.error.issues[0].message);
      setStep(1);
      return;
    }
    const tasks = addTasks ? [
      { title: "早间照护记录", localTime: morning },
      { title: "晚间照护记录", localTime: evening },
    ].map(({ title, localTime }) => careTaskSchema.parse({
      id: crypto.randomUUID(), petId, type: "meal_insulin", title, localTime,
      repeatDays: [0, 1, 2, 3, 4, 5, 6], enabled: true, createdAt: now, updatedAt: now,
    })) : [];
    if (!dispatch({ type: "completeOnboarding", pet: petResult.data, tasks })) {
      setError("保存失败，请检查浏览器是否允许本地存储。");
    }
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <div className="brand-mark">糖</div>
        <p className="eyebrow">本地优先 · 无需注册</p>
        <h1>{step === 0 ? "先说清楚边界" : step === 1 ? "认识你的小狗" : step === 2 ? "选择记录单位" : "设置今日计划"}</h1>
        <div className="step-dots" aria-label={`第 ${step + 1} 步，共 4 步`}>{[0,1,2,3].map((item) => <span key={item} className={item <= step ? "active" : ""} />)}</div>
        <form className="stack" onSubmit={step === 3 ? finish : (event) => { event.preventDefault(); setStep((current) => current + 1); }}>
          {step === 0 && <>
            <p className="lead">这里帮助你把每天发生的照护事实放在一起，方便自己回顾和复诊沟通。</p>
            <Disclaimer />
            <label className="check-row"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />我已了解产品边界</label>
          </>}
          {step === 1 && <>
            <label>小狗名字<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：豆豆" required /></label>
            <label>品种（可选）<input value={breed} onChange={(e) => setBreed(e.target.value)} /></label>
            {error && <p className="form-error">{error}</p>}
          </>}
          {step === 2 && <>
            <p className="lead">请选择你实际使用的血糖记录单位。修改默认单位不会转换历史记录。</p>
            <div className="choice-grid">
              {(["mg/dL", "mmol/L"] as const).map((item) => <label className={`choice-card ${unit === item ? "selected" : ""}`} key={item}><input type="radio" checked={unit === item} onChange={() => setUnit(item)} />{item}</label>)}
            </div>
          </>}
          {step === 3 && <>
            <p className="lead">计划只由你依据兽医给出的方案填写；应用不会提供默认治疗时间或剂量。</p>
            <label className="check-row"><input type="checkbox" checked={addTasks} onChange={(e) => setAddTasks(e.target.checked)} />创建两个每日照护记录入口</label>
            {addTasks && <div className="form-grid"><label>早间时间<input type="time" value={morning} onChange={(e) => setMorning(e.target.value)} /></label><label>晚间时间<input type="time" value={evening} onChange={(e) => setEvening(e.target.value)} /></label></div>}
          </>}
          <div className="button-row">
            {step > 0 && <button type="button" className="secondary" onClick={() => setStep((current) => current - 1)}>上一步</button>}
            <button type="submit" disabled={step === 0 && !accepted}>{step === 3 ? "开始记录" : "下一步"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
