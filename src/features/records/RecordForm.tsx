import { useMemo, useState, type FormEvent } from "react";
import { careRecordSchema, type CareRecord, type TreatmentEvent } from "../../domain/schema";
import { fromLocalInput, toLocalInput } from "../../domain/helpers";
import { useApp } from "../../app/AppContext";
import { Disclaimer } from "../../components/Disclaimer";

export type RecordKind = "meal_treatment" | "glucose" | "weight" | "observation" | "all";

const symptoms = ["精神不佳", "呕吐", "腹泻", "行走异常", "食欲变化", "其他不适"];

export function RecordForm({
  kind,
  taskId,
  existing,
  onSaved,
  onCancel,
}: {
  kind: RecordKind;
  taskId?: string;
  existing?: CareRecord;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { pet, dispatch } = useApp();
  const [recordedAt, setRecordedAt] = useState(toLocalInput(existing?.recordedAt));
  const [glucoseValue, setGlucoseValue] = useState(existing?.glucose?.value?.toString() || "");
  const [glucoseContext, setGlucoseContext] = useState(existing?.glucose?.context || "unknown");
  const existingTreatment = existing?.treatments?.[0];
  const [foodName, setFoodName] = useState(existing?.meal?.foodName || localStorage.getItem(`pet-care:last-food:${pet?.id || "default"}`) || "");
  const [foodAmount, setFoodAmount] = useState(existing?.meal?.amount?.toString() || "");
  const [consumedLevel, setConsumedLevel] = useState(existing?.meal?.consumedLevel || "unknown");
  const [administered, setAdministered] = useState(Boolean(existingTreatment));
  const [confirmed, setConfirmed] = useState(Boolean(existingTreatment));
  const [treatmentKind, setTreatmentKind] = useState<TreatmentEvent["kind"] | "">(existingTreatment?.kind || "");
  const [treatmentName, setTreatmentName] = useState(existingTreatment?.name || "");
  const [treatmentAmount, setTreatmentAmount] = useState(existingTreatment?.recordedAmount?.toString() || "");
  const [treatmentUnit, setTreatmentUnit] = useState(existingTreatment?.unitLabel || "");
  const [weight, setWeight] = useState(existing?.weightKg?.toString() || "");
  const [waterMl, setWaterMl] = useState(existing?.waterMl?.toString() || "");
  const [appetite, setAppetite] = useState(existing?.dailyObservation?.appetite || "");
  const [drinking, setDrinking] = useState(existing?.dailyObservation?.drinking || "");
  const [urination, setUrination] = useState(existing?.dailyObservation?.urination || "");
  const [activity, setActivity] = useState(existing?.dailyObservation?.activity || "");
  const [selectedSymptoms, setSelectedSymptoms] = useState(existing?.dailyObservation?.symptoms || []);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [error, setError] = useState("");

  const show = useMemo(() => ({
    meal: kind === "meal_treatment" || kind === "all",
    glucose: kind === "glucose" || kind === "all",
    weight: kind === "weight" || kind === "all",
    observation: kind === "observation" || kind === "all",
  }), [kind]);

  function numeric(value: string) {
    return value.trim() === "" ? undefined : Number(value);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!pet) return;
    if (administered && !confirmed) {
      setError("请确认这次治疗已经实际完成后再保存。");
      return;
    }
    if (administered && !treatmentKind) {
      setError("请选择已经执行的治疗类型。");
      return;
    }
    const now = new Date().toISOString();
    const candidate = {
      id: existing?.id || crypto.randomUUID(),
      petId: pet.id,
      taskId: taskId || existing?.taskId,
      recordedAt: fromLocalInput(recordedAt),
      glucose: show.glucose && glucoseValue !== "" ? {
        value: numeric(glucoseValue),
        unit: pet.defaultGlucoseUnit,
        context: glucoseContext,
      } : undefined,
      meal: show.meal ? {
        foodName: foodName.trim() || undefined,
        amount: numeric(foodAmount),
        unit: foodAmount ? "g" : undefined,
        consumedLevel,
      } : undefined,
      treatments: show.meal && administered && treatmentKind ? [{
        kind: treatmentKind,
        administered: true,
        name: treatmentName.trim() || undefined,
        recordedAmount: numeric(treatmentAmount),
        unitLabel: treatmentUnit.trim() || undefined,
      }] : undefined,
      weightKg: show.weight ? numeric(weight) : undefined,
      waterMl: show.observation ? numeric(waterMl) : undefined,
      dailyObservation: show.observation ? {
        appetite: appetite || undefined,
        drinking: drinking || undefined,
        urination: urination || undefined,
        activity: activity || undefined,
        symptoms: selectedSymptoms.length ? selectedSymptoms : undefined,
      } : undefined,
      notes: notes.trim() || undefined,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const result = careRecordSchema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (foodName.trim()) localStorage.setItem(`pet-care:last-food:${pet.id}`, foodName.trim());
    if (!dispatch({ type: "saveRecord", record: result.data })) {
      setError("保存失败，表单内容已保留。请检查浏览器存储后重试。");
      return;
    }
    onSaved();
  }

  const levelOptions = [
    ["less", "比平时少"], ["usual", "差不多"], ["more", "比平时多"], ["unknown", "不确定"],
  ];

  return (
    <form className="stack record-form" onSubmit={submit}>
      <label>记录时间<input type="datetime-local" value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)} required /></label>

      {show.meal && <fieldset>
        <legend>进食情况</legend>
        <label>吃了多少
          <select value={consumedLevel} onChange={(e) => setConsumedLevel(e.target.value as typeof consumedLevel)}>
            <option value="none">没有吃</option><option value="little">少量</option><option value="half">约一半</option>
            <option value="most">大部分</option><option value="all">全部</option><option value="unknown">不确定</option>
          </select>
        </label>
        <div className="form-grid">
          <label>食物名称（可选）<input value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="会记住上次填写内容" /></label>
          <label>食物克数（可选）<input type="number" min="0" step="0.1" value={foodAmount} onChange={(e) => setFoodAmount(e.target.value)} /></label>
        </div>
        <label className="check-row"><input type="checkbox" checked={administered} onChange={(e) => { setAdministered(e.target.checked); if (!e.target.checked) setConfirmed(false); }} />同时记录一次已经执行的治疗</label>
        {administered && <div className="insulin-box">
          <Disclaimer compact />
          <div className="form-grid">
            <label>治疗类型<select value={treatmentKind} onChange={(e) => setTreatmentKind(e.target.value as TreatmentEvent["kind"] | "")} required>
              <option value="">请选择</option><option value="insulin">胰岛素注射</option><option value="oral_medication">口服用药</option><option value="other">其他治疗</option>
            </select></label>
            <label>名称（可留空）<input value={treatmentName} onChange={(e) => setTreatmentName(e.target.value)} placeholder="只填写实际使用名称" /></label>
            <label>实际记录量（可留空）<input type="number" min="0" step="0.01" value={treatmentAmount} onChange={(e) => setTreatmentAmount(e.target.value)} placeholder="由你按实际执行填写" /></label>
            <label>单位（可留空）<input value={treatmentUnit} onChange={(e) => setTreatmentUnit(e.target.value)} placeholder="按包装或兽医方案填写" /></label>
          </div>
          <label className="check-row confirm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />我确认这次治疗已经实际完成</label>
        </div>}
      </fieldset>}

      {show.glucose && <fieldset>
        <legend>血糖记录</legend>
        <div className="form-grid">
          <label>数值<input type="number" min="0" step="0.1" value={glucoseValue} onChange={(e) => setGlucoseValue(e.target.value)} placeholder={pet?.defaultGlucoseUnit} /></label>
          <label>记录场景<select value={glucoseContext} onChange={(e) => setGlucoseContext(e.target.value as typeof glucoseContext)}>
            <option value="before_meal">餐前</option><option value="after_meal">餐后</option><option value="random">随机</option><option value="unknown">未标注</option>
          </select></label>
        </div>
      </fieldset>}

      {show.weight && <fieldset><legend>体重</legend><label>体重（kg）<input type="number" min="0" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} /></label></fieldset>}

      {show.observation && <fieldset>
        <legend>今日状态</legend>
        <div className="form-grid">
          {[["食欲", appetite, setAppetite], ["饮水", drinking, setDrinking], ["排尿", urination, setUrination], ["活动量", activity, setActivity]].map(([label, value, setter]) =>
            <label key={label as string}>{label as string}
              <select value={value as string} onChange={(e) => (setter as typeof setAppetite)(e.target.value as typeof appetite)}>
                <option value="">未记录</option>{levelOptions.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
              </select>
            </label>)}
          <label>饮水量 ml（可选）<input type="number" min="0" step="1" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} /></label>
        </div>
        <span className="field-label">观察到的情况（可多选）</span>
        <div className="chip-group">{symptoms.map((symptom) =>
          <label className={`chip ${selectedSymptoms.includes(symptom) ? "selected" : ""}`} key={symptom}>
            <input type="checkbox" checked={selectedSymptoms.includes(symptom)} onChange={() => setSelectedSymptoms((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom])} />
            {symptom}
          </label>)}
        </div>
      </fieldset>}

      <label>备注（可选）<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="只记录你观察到的事实或想向兽医说明的信息" /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="button-row"><button type="button" className="secondary" onClick={onCancel}>取消</button><button type="submit">保存记录</button></div>
    </form>
  );
}
