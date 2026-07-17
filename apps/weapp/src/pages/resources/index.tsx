import { Text, View } from "@tarojs/components";
import { careArticles, isArticlePublishable, sourceDirectory } from "@sugarpet/content";

export default function ResourcesPage() {
  const articles = careArticles.filter((article) => isArticlePublishable(article));
  return <View className="page">
    <Text className="eyebrow">REVIEW GATE</Text><Text className="title">照护资料</Text>
    <Text className="lead">只有完成来源映射、兽医审核且未过复审日期的原创摘要才会公开。</Text>
    <View className="card"><Text className="card-title">已审核文章</Text>{articles.length === 0 ? <Text className="muted">当前没有通过发布门禁的文章，草稿不会展示。</Text> : articles.map((article) => <View className="item" key={article.id}><Text className="item-title">{article.title}</Text><Text className="item-meta">{article.summary}</Text></View>)}</View>
    <View className="card"><Text className="card-title">选题来源目录</Text>{sourceDirectory.map((source) => <View className="item" key={source.id}><Text className="item-title">{source.publisher}</Text><Text className="item-meta">{source.title}</Text></View>)}</View>
    <View className="notice">来源目录不是个体化建议；遇到紧急情况请联系线下兽医或当地急诊机构。</View>
  </View>;
}
