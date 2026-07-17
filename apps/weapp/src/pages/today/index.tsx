import { Button, Input, Picker, Text, View } from "@tarojs/components";
import { useDidShow } from "@tarojs/taro";
import { useState } from "react";
import type { Species } from "@sugarpet/domain";
import { activePet, createPet, loadBundle } from "../../store";

export default function TodayPage() {
  const [bundle, setBundle] = useState(loadBundle);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species>("dog");
  useDidShow(() => setBundle(loadBundle()));
  const pet = activePet(bundle);
  const records = pet ? bundle.records.filter((record) => record.petId === pet.id) : [];
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((record) => record.recordedAt.slice(0, 10) === today);

  if (!pet) return <View className="page">
    <Text className="eyebrow">LOCAL-FIRST PROTOTYPE</Text>
    <Text className="title">先建立糖宠档案</Text>
    <Text className="lead">当前技术原型支持糖尿病犬与猫。照护记录只保存在本机微信存储中。</Text>
    <View className="card">
      <View className="field"><Text className="label">宠物称呼</Text><Input className="input" value={name} onInput={(event) => setName(event.detail.value)} /></View>
      <View className="field"><Text className="label">物种</Text><Picker mode="selector" range={["犬", "猫"]} onChange={(event) => setSpecies(Number(event.detail.value) === 1 ? "cat" : "dog")}><View className="picker">{species === "cat" ? "猫" : "犬"}</View></Picker></View>
      <Button className="button" disabled={!name.trim()} onClick={() => setBundle(createPet(name, species))}>创建本机档案</Button>
    </View>
    <View className="notice">本产品用于记录与复诊准备，不提供诊断、治疗方案或剂量建议。</View>
  </View>;

  return <View className="page">
    <Text className="eyebrow">TODAY · {pet.species === "cat" ? "猫" : "犬"}</Text>
    <Text className="title">{pet.name}，今天记录了 {todayRecords.length} 次</Text>
    <Text className="lead">先确认事实，再完成一次简短记录。小程序不会根据数据判断病情。</Text>
    <View className="card"><Text className="card-title">今日记录</Text>{todayRecords.length === 0 ? <Text className="muted">今天还没有在本应用记录。</Text> : todayRecords.map((record) => <View className="item" key={record.id}><Text className="item-title">{record.recordedAt.slice(11, 16)}</Text><Text className="item-meta">{record.meal ? "进食 " : ""}{record.glucose ? `血糖 ${record.glucose.value} ${record.glucose.unit}` : ""}{record.treatments?.length ? " 已执行治疗" : ""}</Text></View>)}</View>
    <View className="notice">照护记录默认不产生网络请求；资料与未来社区将采用独立云端边界。</View>
  </View>;
}
