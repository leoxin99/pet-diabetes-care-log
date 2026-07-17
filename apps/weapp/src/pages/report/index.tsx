import { Text, View } from "@tarojs/components";
import { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import { activePet, loadBundle } from "../../store";

export default function ReportPage() {
  const [bundle, setBundle] = useState(loadBundle);
  const [now, setNow] = useState(() => Date.now());
  useDidShow(() => { setBundle(loadBundle()); setNow(Date.now()); });
  const pet = activePet(bundle);
  const start = now - 14 * 24 * 60 * 60 * 1000;
  const records = pet ? bundle.records.filter((record) => record.petId === pet.id && new Date(record.recordedAt).getTime() >= start) : [];
  const days = new Set(records.map((record) => record.recordedAt.slice(0, 10))).size;
  return <View className="page">
    <Text className="eyebrow">14-DAY FACT REPORT</Text><Text className="title">复诊事实摘要</Text>
    {!pet ? <View className="card"><Text className="muted">请先在今日页建立宠物档案。</Text></View> : <>
      <View className="card"><Text className="card-title">{pet.name} · {pet.species === "cat" ? "猫" : "犬"}</Text><Text className="metric">{records.length}</Text><Text className="muted">过去 14 天记录总数</Text><Text className="metric">{days}/14</Text><Text className="muted">有记录日期覆盖，不代表健康或照护评分</Text></View>
      <View className="card"><Text className="card-title">原始记录</Text>{records.length === 0 ? <Text className="muted">该区间暂无记录。</Text> : records.slice().reverse().map((record) => <View className="item" key={record.id}><Text className="item-title">{record.recordedAt.slice(0, 16).replace("T", " ")}</Text><Text className="item-meta">{record.glucose ? `${record.glucose.value} ${record.glucose.unit}` : "无血糖数值"}{record.treatments?.length ? " · 已执行治疗" : ""}</Text></View>)}</View>
    </>}
    <View className="notice">原型仅显示事实摘要；Canvas 长图导出和真机兼容性仍待验证。</View>
  </View>;
}
