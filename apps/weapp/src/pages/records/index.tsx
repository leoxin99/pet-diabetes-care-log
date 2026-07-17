import Taro, { useDidShow } from "@tarojs/taro";
import { Button, Input, Picker, Switch, Text, View } from "@tarojs/components";
import { useState } from "react";
import type { GlucoseUnit, TreatmentKind } from "@sugarpet/domain";
import { activePet, addRecord, loadBundle } from "../../store";

export default function RecordsPage() {
  const [bundle, setBundle] = useState(loadBundle);
  const [glucose, setGlucose] = useState("");
  const [unit, setUnit] = useState<GlucoseUnit>("mg/dL");
  const [meal, setMeal] = useState(false);
  const [treatment, setTreatment] = useState(false);
  const [kind, setKind] = useState<TreatmentKind>("insulin");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  useDidShow(() => setBundle(loadBundle()));
  const pet = activePet(bundle);

  const save = () => {
    if (!pet) return Taro.showToast({ title: "请先在今日页建档", icon: "none" });
    if (!meal && !glucose && !treatment) return Taro.showToast({ title: "请至少填写一项事实", icon: "none" });
    const value = glucose ? Number(glucose) : undefined;
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) return Taro.showToast({ title: "血糖数值无效", icon: "none" });
    if (treatment && !name.trim()) return Taro.showToast({ title: "请手动填写治疗名称", icon: "none" });
    const next = addRecord({
      petId: pet.id,
      recordedAt: new Date().toISOString(),
      meal: meal ? { consumedLevel: "unknown" } : undefined,
      glucose: value === undefined ? undefined : { value, unit, context: "unknown" },
      treatments: treatment ? [{ kind, administered: true, name: name.trim(), recordedAmount: amount ? Number(amount) : undefined }] : [],
    });
    setBundle(next); setGlucose(""); setMeal(false); setTreatment(false); setName(""); setAmount("");
    Taro.showToast({ title: "已保存到本机", icon: "success" });
  };

  return <View className="page">
    <Text className="eyebrow">QUICK RECORD</Text><Text className="title">记录已发生的事实</Text>
    <Text className="lead">不预填药名、治疗量或治疗时间。只有主动打开“确认已执行”才保存治疗记录。</Text>
    <View className="card">
      <View className="field"><Text className="label">记录进食</Text><Switch checked={meal} color="#506b78" onChange={(event) => setMeal(event.detail.value)} /></View>
      <View className="field"><Text className="label">血糖（可选）</Text><View className="row"><Input className="input" type="digit" value={glucose} onInput={(event) => setGlucose(event.detail.value)} /><Picker mode="selector" range={["mg/dL", "mmol/L"]} onChange={(event) => setUnit(Number(event.detail.value) === 1 ? "mmol/L" : "mg/dL")}><View className="picker">{unit}</View></Picker></View></View>
      <View className="field"><Text className="label">我确认治疗已经执行</Text><Switch checked={treatment} color="#506b78" onChange={(event) => setTreatment(event.detail.value)} /></View>
      {treatment && <View>
        <View className="field"><Text className="label">治疗类型</Text><Picker mode="selector" range={["胰岛素", "口服药", "其他"]} onChange={(event) => setKind((["insulin", "oral_medication", "other"] as TreatmentKind[])[Number(event.detail.value)])}><View className="picker">{{ insulin: "胰岛素", oral_medication: "口服药", other: "其他" }[kind]}</View></Picker></View>
        <View className="field"><Text className="label">治疗名称（手动填写）</Text><Input className="input" value={name} onInput={(event) => setName(event.detail.value)} /></View>
        <View className="field"><Text className="label">实际记录量（可空）</Text><Input className="input" type="digit" value={amount} onInput={(event) => setAmount(event.detail.value)} /></View>
      </View>}
      <Button className="button" onClick={save}>保存本机记录</Button>
    </View>
  </View>;
}
