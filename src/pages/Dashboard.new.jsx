import { lazy, Suspense, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import { useAuth } from "../context/AuthContext";
import { ErrorBoundary } from "../components/shared/ErrorBoundary";
import { PageSpinner } from "../components/shared/UIStates";

const DashHome = lazy(() => import("./dashboard/HomePage"));
const ScripturePage = lazy(() => import("./dashboard/ScripturePage"));
const PrayerPage = lazy(() => import("./dashboard/PrayerPage"));
const ReflectionPage = lazy(() => import("./dashboard/ReflectionPage"));
const RemindersPage = lazy(() => import("./dashboard/RemindersPage"));
const ProgressPage = lazy(() => import("./dashboard/ProgressPage"));
const PathwayPage = lazy(() => import("./dashboard/PathwayPage"));
const CommunityFeed = lazy(() => import("./CommunityFeed"));
const VideoLibrary = lazy(() => import("./VideoLibrary"));
const AdminPanel = lazy(() => import("./AdminPanel"));
const ReflectionHistory = lazy(() => import("./ReflectionHistory"));
const PathwayLevel = lazy(() => import("./PathwayLevel"));
const LessonEditor = lazy(() => import("./LessonEditor"));

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isAdmin } = useAuth();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        <header
          className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
          style={{
            background: "var(--bg-sidebar)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost p-1.5 rounded-lg"
          >
            <Menu size={22} />
          </button>
          <span
            className="font-display font-bold text-sm"
            style={{ color: "var(--accent)" }}
          >
            Today with Christ
          </span>
          <div className="user-avatar text-sm">
            {(profile?.fullName || "U")[0].toUpperCase()}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          <ErrorBoundary>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route index element={<DashHome />} />
                <Route path="scripture" element={<ScripturePage />} />
                <Route path="prayer" element={<PrayerPage />} />
                <Route path="reflection" element={<ReflectionPage />} />
                <Route path="history" element={<ReflectionHistory />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="reminders" element={<RemindersPage />} />
                <Route path="community" element={<CommunityFeed />} />
                <Route path="videos" element={<VideoLibrary />} />
                <Route path="pathway" element={<PathwayPage />} />
                <Route path="pathway/:levelIndex" element={<PathwayLevel />} />
                <Route
                  path="pathway/:levelIndex/add-lesson"
                  element={<LessonEditor />}
                />
                <Route
                  path="pathway/:levelIndex/edit/:lessonId"
                  element={<LessonEditor />}
                />
                {isAdmin && <Route path="admin" element={<AdminPanel />} />}
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
