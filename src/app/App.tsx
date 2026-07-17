import { lazy, Suspense } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "./AppContext";
import { Onboarding } from "../features/onboarding/Onboarding";

const TodayPage = lazy(() => import("../features/today/TodayPage").then((module) => ({ default: module.TodayPage })));
const RecordsPage = lazy(() => import("../features/records/RecordsPage").then((module) => ({ default: module.RecordsPage })));
const AnalyticsPage = lazy(() => import("../features/analytics/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })));
const ReportsPage = lazy(() => import("../features/reports/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const ResourcesPage = lazy(() => import("../features/resources/ResourcesPage").then((module) => ({ default: module.ResourcesPage })));
const CommunityPage = lazy(() => import("../features/community/CommunityPage").then((module) => ({ default: module.CommunityPage })));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage").then((module) => ({ default: module.SettingsPage })));

const navItems = [
  { to: "/today", icon: "今", label: "今日" },
  { to: "/records", icon: "录", label: "记录" },
  { to: "/analytics", icon: "析", label: "分析" },
  { to: "/reports", icon: "报", label: "报告" },
  { to: "/resources", icon: "知", label: "资料" },
  { to: "/community", icon: "助", label: "互助" },
  { to: "/settings", icon: "设", label: "设置" },
];
const bottomNavItems = navItems.filter((item) => ["/today", "/records", "/resources", "/community", "/settings"].includes(item.to));

function AppShell() {
  const { state, pet } = useApp();
  if (!state.onboardingComplete || !pet) return <Onboarding />;
  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <a className="brand" href="#/today"><span>糖</span><div><strong>糖宠照护</strong><small>记录 · 回顾 · 沟通</small></div></a>
        <nav>{navItems.map((item) => <NavLink key={item.to} to={item.to}><span>{item.icon}</span>{item.label}</NavLink>)}</nav>
        <div className="privacy-note"><strong>仅保存在此浏览器</strong><small>请在设置中定期备份</small></div>
      </aside>
      <main className="content">
        <Suspense fallback={<div className="page loading-state">正在打开本地记录…</div>}>
          <Routes>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </Suspense>
      </main>
      <nav className="bottom-nav no-print">{bottomNavItems.map((item) => <NavLink key={item.to} to={item.to}><span>{item.icon}</span><small>{item.label}</small></NavLink>)}</nav>
    </div>
  );
}

export function App() {
  return <AppProvider><HashRouter><AppShell /></HashRouter></AppProvider>;
}
