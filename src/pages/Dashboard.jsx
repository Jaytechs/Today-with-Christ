// src/pages/Dashboard.jsx — Complete enhanced dashboard

import {
  lazy,
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Routes, Route, Link } from "react-router-dom";
import {
  Menu,
  Flame,
  BookOpen,
  Heart,
  PenLine,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  HandHeart,
  Shield,
  Bell,
  Save,
  X,
  Pencil,
} from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import { ErrorBoundary } from "../components/shared/ErrorBoundary";
import { PageSpinner } from "../components/shared/UIStates";
import CommunityFeed from "./CommunityFeed";
import VideoLibrary from "./VideoLibrary";
import AdminPanel from "./AdminPanel";
import ReflectionHistory from "./ReflectionHistory";
import PathwayLevel from "./PathwayLevel";
import LessonEditor from "./LessonEditor";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getTodaysDevotion,
  getTodaysPrayer,
  getTodaysFocus,
  getTodayProgress,
  recordActivity,
  updateStreak,
  getUserLessonProgress,
  PATHWAY_LEVELS,
  SAMPLE_DEVOTIONS,
  SAMPLE_PRAYERS,
  subscribeToScriptures,
  addScripture,
  deleteScripture,
  getScriptureShuffleIndex,
  msUntilNextScriptureRotation,
  subscribeToPrayerRequests,
  addPrayerRequest,
  deletePrayerRequest,
  markPrayerAnswered,
  togglePrayedFor,
  subscribeToPrayerPoints,
  addPrayerPoint,
  deletePrayerPoint,
  REMINDER_SLOTS,
  getUserReminders,
  saveUserReminders,
  scheduleLocalReminders,
  subscribeToPathwayLevels,
  createPathwayLevel,
  updatePathwayLevel,
  deletePathwayLevel,
} from "../firebase/firestore";

const DashHomeModule = lazy(() => import("./dashboard/HomePage"));
const ScripturePageModule = lazy(() => import("./dashboard/ScripturePage"));
const PrayerPageModule = lazy(() => import("./dashboard/PrayerPage"));
const ReflectionPageModule = lazy(() => import("./dashboard/ReflectionPage"));
const RemindersPageModule = lazy(() => import("./dashboard/RemindersPage"));
const ProgressPageModule = lazy(() => import("./dashboard/ProgressPage"));
const PathwayPageModule = lazy(() => import("./dashboard/PathwayPage"));

// ── Guest Banner ─────────────────────────────────────────────────────────────
function GuestBanner() {
  return (
    <div
      className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 mb-4 rounded-xl text-sm"
      style={{
        background: "color-mix(in srgb, var(--accent) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
      }}
    >
      <div style={{ color: "var(--text-b)" }}>
        <span className="font-semibold" style={{ color: "var(--text-h)" }}>
          You are browsing as a guest.
        </span>{" "}
        Log in to save reflections, track streaks, and join prayer.
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <a href="/register" className="btn-primary text-xs py-1.5 px-4">
          Create Account
        </a>
        <a href="/login" className="btn-secondary text-xs py-1.5 px-4">
          Log In
        </a>
      </div>
    </div>
  );
}

// ── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, className = "", style = {} }) {
  return (
    <div className={`dash-card ${className}`} style={style}>
      {children}
    </div>
  );
}
function CardLabel({ icon: Icon, children }) {
  return (
    <div className="section-label mb-4">
      <div
        style={{
          width: 3,
          height: 14,
          borderRadius: 2,
          background: "var(--accent)",
          display: "inline-block",
        }}
      />
      {Icon && <Icon size={12} style={{ color: "var(--accent)" }} />}
      {children}
    </div>
  );
}
function greeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t("greeting");
  if (h < 17) return t("greetingAfternoon");
  return t("greetingEvening");
}
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg"
      style={{
        background: "color-mix(in srgb, var(--accent2) 15%, var(--bg-card))",
        color: "var(--accent2)",
        border: "1px solid color-mix(in srgb, var(--accent2) 30%, transparent)",
      }}
    >
      {msg}
    </div>
  );
}

// ── HOME DASHBOARD ──────────────────────────────────────────────────────────
function DashHome() {
  const { user, profile, refreshProfile, isGuest, canInteract } = useAuth();
  const { t, lang } = useLanguage();
  const [devotion, setDevotion] = useState(null);
  const [prayer, setPrayer] = useState(null);
  const [completed, setCompleted] = useState({
    devotion: false,
    prayer: false,
    reflection: false,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const todayFocus = getTodaysFocus();
  const hour = new Date().getHours();
  const prayerSlot = hour < 12 ? "Morning" : hour < 17 ? "Midday" : "Evening";

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTodaysDevotion(lang),
      getTodaysPrayer(lang),
      user
        ? getTodayProgress(user.uid)
        : Promise.resolve({
            devotion: false,
            prayer: false,
            reflection: false,
          }),
    ])
      .then(([dev, pray, progress]) => {
        setDevotion(dev);
        setPrayer(pray);
        setCompleted(progress);
        setLoading(false);
      })
      .catch(() => {
        const devs = SAMPLE_DEVOTIONS[lang] || SAMPLE_DEVOTIONS.en;
        const prayers = SAMPLE_PRAYERS[lang] || SAMPLE_PRAYERS.en;
        const slot = hour < 12 ? "morning" : hour < 17 ? "midday" : "evening";
        setDevotion(devs[0]);
        setPrayer(prayers[slot] || prayers.morning);
        setLoading(false);
      });
  }, [lang, user]);

  const markComplete = useCallback(
    async (type) => {
      if (isGuest) {
        window.location.href = "/login";
        return;
      }
      if (completed[type] || !user) return;
      setCompleted((c) => ({ ...c, [type]: true }));
      await recordActivity(user.uid, type);
      const all = { ...completed, [type]: true };
      if (all.devotion && all.prayer && all.reflection) {
        await updateStreak(user.uid);
        await refreshProfile();
        showToast("Daily flow complete! Streak updated 🔥");
      } else {
        showToast(
          `${type.charAt(0).toUpperCase() + type.slice(1)} marked complete ✓`,
        );
      }
    },
    [completed, user, refreshProfile],
  );

  const name = profile?.fullName || user?.displayName || "Friend";
  const streak = profile?.currentStreak || 0;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--accent)" }}
        />
        <p className="text-sm" style={{ color: "var(--text-m)" }}>
          Loading today's content…
        </p>
      </div>
    );

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      <Toast msg={toast} />
      <div>
        <p className="text-sm" style={{ color: "var(--text-m)" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1
          className="font-display font-bold text-3xl mt-1"
          style={{ color: "var(--text-h)" }}
        >
          {greeting(t)}, {name.split(" ")[0]} 🙏
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex flex-col items-center justify-center py-8 text-center">
          <Flame
            size={32}
            style={{ color: "var(--accent)" }}
            className="mb-2"
          />
          <div className="streak-number">{streak}</div>
          <div
            className="text-xs mt-1 uppercase tracking-wider"
            style={{ color: "var(--text-m)" }}
          >
            {t("streakDays")}
          </div>
          <div className="progress-bar w-full mt-3 max-w-[120px]">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((streak / 21) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--text-m)" }}>
            {streak} / 21 day goal
          </div>
        </Card>
        <Card className="sm:col-span-2">
          <CardLabel>Today's Actions</CardLabel>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Devotion",
                icon: BookOpen,
                type: "devotion",
                color: "var(--accent)",
              },
              {
                label: "Prayer",
                icon: Heart,
                type: "prayer",
                color: "#EC4899",
              },
              {
                label: "Reflect",
                icon: PenLine,
                type: "reflection",
                color: "#8B5CF6",
              },
            ].map(({ label, icon: Icon, type, color }) => (
              <button
                key={type}
                onClick={() => markComplete(type)}
                className={`quick-action ${type}`}
              >
                {completed[type] ? (
                  <CheckCircle2 size={22} style={{ color: "var(--accent2)" }} />
                ) : (
                  <Icon size={22} style={{ color }} />
                )}
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-b)" }}
                >
                  {completed[type] ? "✓ Done" : label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--text-m)" }}>
            Complete all three to update your streak.
          </p>
        </Card>
      </div>

      {devotion && (
        <Card>
          <CardLabel icon={BookOpen}>{t("todaysWord")}</CardLabel>
          <p className="verse-italic text-xl sm:text-2xl mb-4">
            "{devotion.scripture}"
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <span className="verse-ref">{devotion.reference}</span>
            <span className="card-tag">{devotion.focus}</span>
          </div>
          {devotion.devotion && (
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "var(--text-b)",
                borderTop: "1px solid var(--border)",
                paddingTop: "1rem",
              }}
            >
              {devotion.devotion}
            </p>
          )}
          {devotion.application && (
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              }}
            >
              <div
                className="text-xs font-bold tracking-wider uppercase mb-2"
                style={{ color: "var(--accent)" }}
              >
                Apply Today
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-b)" }}
              >
                {devotion.application}
              </p>
            </div>
          )}
          <button
            onClick={() => markComplete("devotion")}
            className="btn-primary mt-4 text-sm py-2 px-4"
            style={{ opacity: completed.devotion ? 0.6 : 1 }}
          >
            {completed.devotion ? "✓ Completed" : "Mark Devotion Complete"}
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardLabel>{t("todaysFocus")}</CardLabel>
          <div
            className="font-display font-bold text-4xl mb-2"
            style={{ color: "var(--accent)" }}
          >
            {todayFocus}
          </div>
          <p
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-m)" }}
          >
            {new Date().toLocaleDateString("en-US", { weekday: "long" })}'s
            focus word
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-b)" }}
          >
            Carry this word with you. Let it shape your decisions,
            conversations, and prayers today.
          </p>
        </Card>
        {prayer && (
          <Card>
            <CardLabel icon={Heart}>{prayerSlot} Prayer</CardLabel>
            <p
              className="font-display italic text-sm leading-relaxed line-clamp-5"
              style={{ color: "var(--text-b)" }}
            >
              "{prayer.prayer}"
            </p>
            <button
              onClick={() => markComplete("prayer")}
              className="btn-secondary text-xs py-2 px-4 mt-4"
              style={{ opacity: completed.prayer ? 0.6 : 1 }}
            >
              {completed.prayer ? "✓ Prayed" : "Mark Prayed"}
            </button>
          </Card>
        )}
      </div>
      <PathwayPreview />
    </div>
  );
}

// ── PATHWAY PREVIEW ──────────────────────────────────────────────────────────
function PathwayPreview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [levels, setLevels] = useState(PATHWAY_LEVELS);
  const [completedIds, setCompletedIds] = useState(new Set());

  useEffect(() => {
    const unsub = subscribeToPathwayLevels(setLevels);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserLessonProgress(user.uid).then((data) => {
      setCompletedIds(
        new Set(data.filter((d) => d.completed).map((d) => d.lessonId)),
      );
    });
  }, [user]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardLabel>{t("growthPathway")}</CardLabel>
        <Link
          to="/dashboard/pathway"
          className="text-xs"
          style={{ color: "var(--accent)" }}
        >
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {levels.slice(0, 5).map((lvl, i) => (
          <Link
            key={lvl.id || lvl.level || i}
            to={`/dashboard/pathway/${lvl.level ?? i}`}
            className="flex items-center gap-4 p-3 rounded-xl transition-all"
            style={{
              border: "1px solid var(--border)",
              background: "transparent",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{
                background: `color-mix(in srgb, ${lvl.color || "var(--accent)"} 20%, transparent)`,
                color: lvl.color || "var(--accent)",
              }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="font-medium text-sm"
                style={{ color: "var(--text-h)" }}
              >
                {lvl.title}
              </div>
              {lvl.description && (
                <div
                  className="text-xs mt-0.5 truncate"
                  style={{ color: "var(--text-m)" }}
                >
                  {lvl.description}
                </div>
              )}
            </div>
            <ChevronRight
              size={14}
              style={{ color: "var(--text-m)", flexShrink: 0 }}
            />
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ── PATHWAY PAGE (with editable levels) ─────────────────────────────────────
function PathwayPage() {
  const { user, canEditContent } = useAuth();
  const { t } = useLanguage();
  const [levels, setLevels] = useState(PATHWAY_LEVELS);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [levelForm, setLevelForm] = useState({
    title: "",
    description: "",
    color: "#D4A373",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    const unsub = subscribeToPathwayLevels(setLevels);
    return unsub;
  }, []);
  useEffect(() => {
    if (!user) return;
    getUserLessonProgress(user.uid).then((data) =>
      setCompletedIds(
        new Set(data.filter((d) => d.completed).map((d) => d.lessonId)),
      ),
    );
  }, [user]);

  async function handleSaveLevel() {
    if (!levelForm.title.trim()) return;
    setSaving(true);
    try {
      if (editingLevel?.id) {
        await updatePathwayLevel(editingLevel.id, {
          title: levelForm.title,
          description: levelForm.description,
          color: levelForm.color,
        });
        showToast("Level updated ✓");
      } else {
        await createPathwayLevel(levelForm);
        showToast("New pathway level added ✓");
      }
      setShowAddLevel(false);
      setEditingLevel(null);
      setLevelForm({ title: "", description: "", color: "#D4A373" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLevel(lvl) {
    if (
      !window.confirm(
        `Delete "${lvl.title}" and all its lessons? This cannot be undone.`,
      )
    )
      return;
    await deletePathwayLevel(lvl.id, lvl.level ?? lvl.order ?? 0);
    showToast("Level deleted.");
  }

  function startEdit(lvl) {
    setEditingLevel(lvl);
    setLevelForm({
      title: lvl.title,
      description: lvl.description || "",
      color: lvl.color || "#D4A373",
    });
    setShowAddLevel(true);
  }

  const PRESET_COLORS = [
    "#E9C46A",
    "#84A98C",
    "#5DADE2",
    "#D4A373",
    "#A8DADC",
    "#E07A5F",
    "#9B72AA",
    "#6BAB90",
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      <Toast msg={toast} />
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-display font-bold text-2xl"
            style={{ color: "var(--text-h)" }}
          >
            {t("growthPathway")}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-m)" }}>
            Click a level to read teachings and complete revision questions.
          </p>
        </div>
        {canEditContent && (
          <button
            onClick={() => {
              setEditingLevel(null);
              setLevelForm({ title: "", description: "", color: "#D4A373" });
              setShowAddLevel(true);
            }}
            className="btn-secondary text-xs py-2 px-4"
          >
            <Plus size={13} /> Add Level
          </button>
        )}
      </div>

      {/* Add/Edit level form */}
      {showAddLevel && canEditContent && (
        <Card>
          <h3
            className="font-display font-semibold text-base mb-4"
            style={{ color: "var(--text-h)" }}
          >
            {editingLevel ? "Edit Level" : "New Pathway Level"}
          </h3>
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-m)" }}
              >
                Level Title *
              </label>
              <input
                className="input-field"
                placeholder="e.g. Kingdom Impact"
                value={levelForm.title}
                onChange={(e) =>
                  setLevelForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-m)" }}
              >
                Description
              </label>
              <input
                className="input-field"
                placeholder="Brief description for members…"
                value={levelForm.description}
                onChange={(e) =>
                  setLevelForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-m)" }}
              >
                Level Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setLevelForm((f) => ({ ...f, color: c }))}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{
                      background: c,
                      border:
                        levelForm.color === c
                          ? "3px solid var(--text-h)"
                          : "2px solid transparent",
                      transform:
                        levelForm.color === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSaveLevel}
                disabled={saving || !levelForm.title.trim()}
                className="btn-primary text-sm py-2 px-4"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={13} /> {editingLevel ? "Update" : "Create"}{" "}
                    Level
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddLevel(false);
                  setEditingLevel(null);
                }}
                className="btn-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {levels.map((lvl, i) => (
          <div
            key={lvl.id || lvl.level || i}
            className="dash-card flex items-center gap-4"
            style={{ borderLeft: `4px solid ${lvl.color || "var(--accent)"}` }}
          >
            <Link
              to={`/dashboard/pathway/${lvl.level ?? i}`}
              className="flex items-center gap-4 flex-1 min-w-0"
              style={{ textDecoration: "none" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-lg"
                style={{
                  background: `color-mix(in srgb, ${lvl.color || "var(--accent)"} 20%, transparent)`,
                  color: lvl.color || "var(--accent)",
                }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-display font-semibold text-base"
                  style={{ color: "var(--text-h)" }}
                >
                  {lvl.title}
                </p>
                {lvl.description && (
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: "var(--text-m)" }}
                  >
                    {lvl.description}
                  </p>
                )}
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-m)" }}
                >
                  Click to view lessons
                </p>
              </div>
              <ChevronRight
                size={16}
                style={{ color: "var(--text-m)", flexShrink: 0 }}
              />
            </Link>
            {canEditContent && (
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => startEdit(lvl)}
                  className="p-1.5 rounded-lg"
                  style={{ color: "var(--text-m)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "color-mix(in srgb, var(--accent) 15%, transparent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-m)";
                  }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDeleteLevel(lvl)}
                  className="p-1.5 rounded-lg"
                  style={{ color: "var(--text-m)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-m)";
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SCRIPTURE PAGE — shuffle every 30 min, add/delete by mentor/admin ────────
function ScripturePage() {
  const { user, canEditContent } = useAuth();
  const [scriptures, setScriptures] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    scripture: "",
    reference: "",
    focus: "Faith",
    devotion: "",
    application: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const timerRef = useRef(null);

  const FOCUS_OPTIONS = [
    "Faith",
    "Prayer",
    "Discipline",
    "Purpose",
    "Humility",
    "Gratitude",
    "Leadership",
    "Salvation",
    "Grace",
    "Love",
    "Hope",
    "Stewardship",
  ];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  // Subscribe to live scripture list
  useEffect(() => {
    const unsub = subscribeToScriptures((data) => {
      setScriptures(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Update shown index every 30 minutes
  useEffect(() => {
    if (!scriptures.length) return;
    function tick() {
      setIdx(getScriptureShuffleIndex(scriptures.length));
    }
    tick();
    // Schedule next tick at the next 30-min boundary
    const ms = msUntilNextScriptureRotation();
    timerRef.current = setTimeout(function loop() {
      tick();
      timerRef.current = setTimeout(loop, 30 * 60 * 1000);
    }, ms);
    return () => clearTimeout(timerRef.current);
  }, [scriptures.length]);

  async function handleAdd() {
    if (!form.scripture.trim() || !form.reference.trim()) return;
    setSaving(true);
    try {
      await addScripture(user.uid, form);
      setForm({
        scripture: "",
        reference: "",
        focus: "Faith",
        devotion: "",
        application: "",
      });
      setShowAdd(false);
      showToast("Scripture added ✓");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this scripture?")) return;
    await deleteScripture(id);
    showToast("Scripture removed.");
  }

  // Fallback to sample data if Firestore empty
  const allScriptures =
    scriptures.length > 0 ? scriptures : SAMPLE_DEVOTIONS.en;
  const current = allScriptures[idx % allScriptures.length];

  // Time until next rotation
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    function updateCountdown() {
      const ms = msUntilNextScriptureRotation();
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${m}m ${s}s`);
    }
    updateCountdown();
    const t = setInterval(updateCountdown, 1000);
    return () => clearInterval(t);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--accent)" }}
        />
      </div>
    );

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      <Toast msg={toast} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2
            className="font-display font-bold text-2xl"
            style={{ color: "var(--text-h)" }}
          >
            Scripture Library
          </h2>
          <p
            className="text-xs mt-1 flex items-center gap-1.5"
            style={{ color: "var(--text-m)" }}
          >
            <RefreshCw size={11} /> Rotates in {countdown}
          </p>
        </div>
        {canEditContent && (
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="btn-secondary text-xs py-2 px-4"
          >
            {showAdd ? (
              <>
                <X size={13} /> Cancel
              </>
            ) : (
              <>
                <Plus size={13} /> Add Scripture
              </>
            )}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && canEditContent && (
        <Card>
          <h3
            className="font-display font-semibold text-base mb-4"
            style={{ color: "var(--text-h)" }}
          >
            Add New Scripture
          </h3>
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-m)" }}
              >
                Scripture Text *
              </label>
              <textarea
                rows={3}
                className="input-field resize-none"
                placeholder="Type or paste the verse…"
                value={form.scripture}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scripture: e.target.value }))
                }
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-m)" }}
                >
                  Reference *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. John 3:16"
                  value={form.reference}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reference: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--text-m)" }}
                >
                  Focus Theme
                </label>
                <select
                  className="input-field"
                  value={form.focus}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, focus: e.target.value }))
                  }
                >
                  {FOCUS_OPTIONS.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-m)" }}
              >
                Devotion / Commentary (optional)
              </label>
              <textarea
                rows={3}
                className="input-field resize-none"
                placeholder="Brief devotional thought on this verse…"
                value={form.devotion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, devotion: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--text-m)" }}
              >
                Application (optional)
              </label>
              <input
                className="input-field"
                placeholder="How to apply this verse today…"
                value={form.application}
                onChange={(e) =>
                  setForm((f) => ({ ...f, application: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAdd}
                disabled={
                  saving || !form.scripture.trim() || !form.reference.trim()
                }
                className="btn-primary text-sm py-2 px-4"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving…
                  </>
                ) : (
                  "Add Scripture"
                )}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Featured / currently showing */}
      {current && (
        <Card style={{ borderLeft: "4px solid var(--accent)" }}>
          <div className="flex items-center justify-between mb-4">
            <CardLabel icon={BookOpen}>Now Showing</CardLabel>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 15%, transparent)",
                color: "var(--accent)",
              }}
            >
              {idx + 1} of {allScriptures.length}
            </span>
          </div>
          <p className="verse-italic text-xl sm:text-2xl mb-4">
            "{current.scripture}"
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <span className="verse-ref">{current.reference}</span>
            <span className="card-tag">{current.focus}</span>
          </div>
          {current.devotion && (
            <p
              className="text-sm leading-relaxed mt-3"
              style={{
                color: "var(--text-b)",
                borderTop: "1px solid var(--border)",
                paddingTop: "1rem",
              }}
            >
              {current.devotion}
            </p>
          )}
          {current.application && (
            <div
              className="mt-4 rounded-xl p-4"
              style={{
                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              }}
            >
              <div
                className="text-xs font-bold tracking-wider uppercase mb-2"
                style={{ color: "var(--accent)" }}
              >
                Apply Today
              </div>
              <p className="text-sm" style={{ color: "var(--text-b)" }}>
                {current.application}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* All scriptures grid */}
      <div>
        <h3
          className="font-display font-semibold text-base mb-3"
          style={{ color: "var(--text-h)" }}
        >
          All Scriptures ({allScriptures.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allScriptures.map((d, i) => (
            <Card
              key={d.id || i}
              style={{
                opacity: i === idx ? 1 : 0.8,
                border:
                  i === idx
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <CardLabel icon={BookOpen}>{d.focus}</CardLabel>
                {canEditContent && d.id && (
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1 rounded flex-shrink-0"
                    style={{ color: "var(--text-m)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-m)";
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <p className="verse-italic text-base mb-3">"{d.scripture}"</p>
              <div className="verse-ref">{d.reference}</div>
              {d.devotion && (
                <p
                  className="text-xs leading-relaxed mt-3 line-clamp-2"
                  style={{ color: "var(--text-b)" }}
                >
                  {d.devotion}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PRAYER PAGE — user requests + mentor prayer points ───────────────────────
function PrayerPage() {
  const { user, profile, canEditContent } = useAuth();
  const { t, lang } = useLanguage();
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [prayerPoints, setPrayerPoints] = useState([]);
  const [tab, setTab] = useState("requests"); // 'requests' | 'points' | 'guided'
  const [newRequest, setNewRequest] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [addingPoint, setAddingPoint] = useState(false);
  const [pointForm, setPointForm] = useState({
    title: "",
    content: "",
    slot: "general",
    scripture: "",
    reference: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const prayers = SAMPLE_PRAYERS[lang] || SAMPLE_PRAYERS.en;
  const hour = new Date().getHours();
  const currentSlot = hour < 12 ? "morning" : hour < 17 ? "midday" : "evening";

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    const u1 = subscribeToPrayerRequests(setPrayerRequests);
    const u2 = subscribeToPrayerPoints(setPrayerPoints);
    return () => {
      u1();
      u2();
    };
  }, []);

  async function handleAddRequest() {
    if (!newRequest.trim() || !user) return;
    setSaving(true);
    try {
      await addPrayerRequest(user.uid, {
        authorName: isAnon ? "Anonymous" : profile?.fullName || "Member",
        text: newRequest,
        isAnonymous: isAnon,
      });
      setNewRequest("");
      showToast("Prayer request submitted 🙏");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPoint() {
    if (!pointForm.title.trim() || !pointForm.content.trim() || !user) return;
    setSaving(true);
    try {
      await addPrayerPoint(user.uid, {
        ...pointForm,
        authorName: profile?.fullName || "Mentor",
      });
      setPointForm({
        title: "",
        content: "",
        slot: "general",
        scripture: "",
        reference: "",
      });
      setAddingPoint(false);
      showToast("Prayer point added ✓");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePrayed(id) {
    if (!user) return;
    await togglePrayedFor(id, user.uid);
  }

  const TABS = [
    { id: "guided", label: "Guided Prayer" },
    { id: "requests", label: "Prayer Requests" },
    { id: "points", label: "Prayer Points" },
  ];

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      <Toast msg={toast} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className="font-display font-bold text-2xl"
          style={{ color: "var(--text-h)" }}
        >
          {t("prayer")}
        </h2>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: "var(--bg-hover)" }}
      >
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all"
            style={{
              background: tab === tb.id ? "var(--bg-card)" : "transparent",
              color: tab === tb.id ? "var(--accent)" : "var(--text-m)",
              boxShadow: tab === tb.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Guided Prayer */}
      {tab === "guided" && (
        <div className="space-y-4">
          {["morning", "midday", "evening"].map((slot) => (
            <Card
              key={slot}
              style={{
                borderLeft:
                  slot === currentSlot ? "4px solid var(--accent)" : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <CardLabel icon={Heart}>
                  {slot.charAt(0).toUpperCase() + slot.slice(1)} Prayer
                </CardLabel>
                {slot === currentSlot && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent2) 15%, transparent)",
                      color: "var(--accent2)",
                    }}
                  >
                    Now
                  </span>
                )}
              </div>
              <p className="verse-italic text-sm leading-relaxed">
                "{prayers[slot]?.prayer || ""}"
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Prayer Requests */}
      {tab === "requests" && (
        <div className="space-y-4">
          <Card>
            <CardLabel>Submit a Prayer Request</CardLabel>
            <textarea
              rows={3}
              className="input-field resize-none mb-3"
              placeholder="Share what you'd like prayer for…"
              value={newRequest}
              onChange={(e) => setNewRequest(e.target.value)}
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label
                className="flex items-center gap-2 text-xs cursor-pointer"
                style={{ color: "var(--text-m)" }}
              >
                <input
                  type="checkbox"
                  checked={isAnon}
                  onChange={(e) => setIsAnon(e.target.checked)}
                  className="rounded"
                />
                Post anonymously
              </label>
              <button
                onClick={handleAddRequest}
                disabled={saving || !newRequest.trim()}
                className="btn-primary text-xs py-2 px-4"
              >
                {saving ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Submitting…
                  </>
                ) : (
                  "🙏 Submit Request"
                )}
              </button>
            </div>
          </Card>

          <div className="space-y-3">
            {prayerRequests.length === 0 && (
              <Card>
                <p
                  className="text-sm text-center py-6"
                  style={{ color: "var(--text-m)" }}
                >
                  No prayer requests yet. Be the first to share. 🙏
                </p>
              </Card>
            )}
            {prayerRequests.map((req) => (
              <Card
                key={req.id}
                style={{
                  border: req.answered
                    ? "1px solid color-mix(in srgb, var(--accent2) 30%, transparent)"
                    : "1px solid var(--border)",
                  background: req.answered
                    ? "color-mix(in srgb, var(--accent2) 4%, transparent)"
                    : "var(--bg-card)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--text-h)" }}
                      >
                        {req.isAnonymous ? "🕊 Anonymous" : req.authorName}
                      </span>
                      {req.answered && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              "color-mix(in srgb, var(--accent2) 15%, transparent)",
                            color: "var(--accent2)",
                          }}
                        >
                          Answered ✓
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: req.answered ? "var(--text-m)" : "var(--text-b)",
                        textDecoration: req.answered ? "line-through" : "none",
                      }}
                    >
                      {req.text}
                    </p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <button
                        onClick={() => handleTogglePrayed(req.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                        style={{
                          background: (req.prayedFor || []).includes(user?.uid)
                            ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                            : "var(--bg-hover)",
                          color: (req.prayedFor || []).includes(user?.uid)
                            ? "var(--accent)"
                            : "var(--text-m)",
                        }}
                      >
                        🙏 Prayed for this ({req.prayedCount || 0})
                      </button>
                      {req.uid === user?.uid && !req.answered && (
                        <button
                          onClick={() => markPrayerAnswered(req.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                          style={{
                            color: "var(--accent2)",
                            background:
                              "color-mix(in srgb, var(--accent2) 10%, transparent)",
                          }}
                        >
                          Mark Answered
                        </button>
                      )}
                      {(req.uid === user?.uid || profile?.role === "admin") && (
                        <button
                          onClick={() => deletePrayerRequest(req.id)}
                          className="text-xs px-2 py-1 rounded"
                          style={{ color: "var(--text-m)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#ef4444")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "var(--text-m)")
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Prayer Points — mentor/admin add */}
      {tab === "points" && (
        <div className="space-y-4">
          {canEditContent && (
            <div>
              {!addingPoint ? (
                <button
                  onClick={() => setAddingPoint(true)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  <Plus size={13} /> Add Prayer Point
                </button>
              ) : (
                <Card>
                  <h3
                    className="font-semibold mb-4"
                    style={{ color: "var(--text-h)" }}
                  >
                    New Prayer Point
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                        style={{ color: "var(--text-m)" }}
                      >
                        Title *
                      </label>
                      <input
                        className="input-field"
                        placeholder="e.g. Pray for unity in the body"
                        value={pointForm.title}
                        onChange={(e) =>
                          setPointForm((f) => ({ ...f, title: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                        style={{ color: "var(--text-m)" }}
                      >
                        Prayer Content *
                      </label>
                      <textarea
                        rows={4}
                        className="input-field resize-none"
                        placeholder="Write the prayer point content…"
                        value={pointForm.content}
                        onChange={(e) =>
                          setPointForm((f) => ({
                            ...f,
                            content: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                          style={{ color: "var(--text-m)" }}
                        >
                          Time Slot
                        </label>
                        <select
                          className="input-field"
                          value={pointForm.slot}
                          onChange={(e) =>
                            setPointForm((f) => ({
                              ...f,
                              slot: e.target.value,
                            }))
                          }
                        >
                          {["morning", "midday", "evening", "general"].map(
                            (s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                      <div>
                        <label
                          className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                          style={{ color: "var(--text-m)" }}
                        >
                          Scripture Reference
                        </label>
                        <input
                          className="input-field"
                          placeholder="e.g. Psalm 133:1"
                          value={pointForm.reference}
                          onChange={(e) =>
                            setPointForm((f) => ({
                              ...f,
                              reference: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddPoint}
                        disabled={
                          saving ||
                          !pointForm.title.trim() ||
                          !pointForm.content.trim()
                        }
                        className="btn-primary text-sm py-2 px-4"
                      >
                        {saving ? "Saving…" : "Add Prayer Point"}
                      </button>
                      <button
                        onClick={() => setAddingPoint(false)}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {prayerPoints.length === 0 && (
            <Card>
              <p
                className="text-sm text-center py-6"
                style={{ color: "var(--text-m)" }}
              >
                No prayer points yet.{canEditContent ? " Add one above." : ""}
              </p>
            </Card>
          )}
          {prayerPoints.map((pt) => (
            <Card key={pt.id} style={{ borderLeft: "4px solid var(--accent)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background:
                          "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      {pt.slot}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-h)" }}
                    >
                      {pt.authorName}
                    </span>
                  </div>
                  <h4
                    className="font-display font-semibold text-base mb-2"
                    style={{ color: "var(--text-h)" }}
                  >
                    {pt.title}
                  </h4>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-b)" }}
                  >
                    {pt.content}
                  </p>
                  {pt.reference && (
                    <p
                      className="text-xs mt-2 italic"
                      style={{ color: "var(--accent)" }}
                    >
                      {pt.reference}
                    </p>
                  )}
                </div>
                {(canEditContent || pt.uid === user?.uid) && (
                  <button
                    onClick={() => deletePrayerPoint(pt.id)}
                    className="p-1.5 rounded flex-shrink-0"
                    style={{ color: "var(--text-m)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#ef4444")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-m)")
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── REMINDERS PAGE ───────────────────────────────────────────────────────────
function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState({
    enabled: false,
    slots: { midnight: false, morning: true, midday: false, evening: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permStatus, setPermStatus] = useState("default");
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    if ("Notification" in window) setPermStatus(Notification.permission);
    if (!user) {
      setLoading(false);
      return;
    }
    getUserReminders(user.uid).then((data) => {
      setReminders(data);
      setLoading(false);
    });
  }, [user]);

  async function requestPermission() {
    if (!("Notification" in window)) {
      showToast("Notifications not supported in this browser.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermStatus(result);
    if (result === "granted") showToast("Notifications enabled ✓");
    else showToast("Permission denied. Check browser settings.");
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserReminders(user.uid, reminders);
      if (reminders.enabled && permStatus === "granted") {
        scheduleLocalReminders(reminders.slots);
      }
      showToast("Reminder settings saved ✓");
    } finally {
      setSaving(false);
    }
  }

  function toggleSlot(slotId) {
    setReminders((r) => ({
      ...r,
      slots: { ...r.slots, [slotId]: !r.slots[slotId] },
    }));
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--accent)" }}
        />
      </div>
    );

  return (
    <div className="space-y-5 max-w-lg">
      <Toast msg={toast} />
      <div>
        <h2
          className="font-display font-bold text-2xl"
          style={{ color: "var(--text-h)" }}
        >
          Reminders
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-m)" }}>
          Get notified at 00:00, 06:00, 12:00, and 18:00 to stay rooted in
          prayer.
        </p>
      </div>

      {/* Permission banner */}
      {permStatus !== "granted" && (
        <div
          className="rounded-xl p-4 flex items-center justify-between gap-3"
          style={{
            background: "color-mix(in srgb, var(--accent) 10%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
          }}
        >
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-h)" }}
            >
              Enable browser notifications
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-m)" }}>
              {permStatus === "denied"
                ? "Notifications blocked. Please enable in browser settings."
                : "Grant permission to receive reminders."}
            </p>
          </div>
          {permStatus !== "denied" && (
            <button
              onClick={requestPermission}
              className="btn-primary text-xs py-2 px-4 flex-shrink-0"
            >
              <Bell size={13} /> Allow
            </button>
          )}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-5">
          <CardLabel icon={Bell}>Daily Reminders</CardLabel>
          <button
            onClick={() => setReminders((r) => ({ ...r, enabled: !r.enabled }))}
            className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
            style={{
              background: reminders.enabled ? "var(--accent)" : "var(--border)",
            }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
              style={{
                left: reminders.enabled ? "1.625rem" : "0.25rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>

        <div className="space-y-3">
          {REMINDER_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                border: "1px solid var(--border)",
                background: reminders.slots[slot.id]
                  ? "color-mix(in srgb, var(--accent) 6%, transparent)"
                  : "transparent",
                opacity: reminders.enabled ? 1 : 0.5,
              }}
            >
              <div>
                <div
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-h)" }}
                >
                  {slot.label}
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-m)" }}
                >
                  {slot.description}
                </div>
              </div>
              <button
                disabled={!reminders.enabled}
                onClick={() => toggleSlot(slot.id)}
                className="relative w-10 h-5 rounded-full transition-all duration-300 flex-shrink-0"
                style={{
                  background:
                    reminders.slots[slot.id] && reminders.enabled
                      ? "var(--accent)"
                      : "var(--border)",
                }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300"
                  style={{
                    left: reminders.slots[slot.id] ? "1.25rem" : "0.125rem",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary mt-5 w-full"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save size={14} /> Save Reminder Settings
            </>
          )}
        </button>
      </Card>

      <div
        className="rounded-xl p-4 text-sm"
        style={{
          background: "color-mix(in srgb, var(--calm) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--calm) 25%, transparent)",
          color: "var(--text-b)",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "var(--text-h)" }}>
          How reminders work
        </p>
        <p>
          Reminders are browser notifications. For them to work, you must have
          this app open (or installed as a PWA). Enable multiple time slots to
          cover your full day of prayer.
        </p>
      </div>
    </div>
  );
}

// ── REFLECTION PAGE ──────────────────────────────────────────────────────────
function ReflectionPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    prayedToday: "",
    challenge: "",
    learned: "",
    mood: "😌",
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const moods = ["😔", "😐", "😌", "😊", "🙏"];

  async function handleSave() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    try {
      const { saveReflection } = await import("../firebase/firestore");
      await saveReflection(user.uid, form);
      // Record activity and update streak
      const { recordActivity, updateStreak } =
        await import("../firebase/firestore");
      await recordActivity(user.uid, "reflection");
      await updateStreak(user.uid);
      setSaved(true);
    } catch (err) {
      console.error("Reflection save failed:", err);
      alert(
        "Could not save your reflection. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (saved)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="text-5xl">✨</div>
        <h2
          className="font-display font-bold text-2xl"
          style={{ color: "var(--text-h)" }}
        >
          {t("thankYou")}
        </h2>
        <p style={{ color: "var(--text-b)" }}>
          Come back tomorrow and keep growing.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setSaved(false)} className="btn-secondary">
            Write Another
          </button>
          <Link to="/dashboard/history" className="btn-primary">
            View History
          </Link>
        </div>
      </div>
    );

  return (
    <div className="space-y-5 max-w-2xl">
      <h2
        className="font-display font-bold text-2xl"
        style={{ color: "var(--text-h)" }}
      >
        {t("dailyReflection")}
      </h2>
      <Card>
        <CardLabel icon={PenLine}>Evening Questions</CardLabel>
        <div className="space-y-5">
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-m)" }}
            >
              {t("howFeeling")}
            </label>
            <div className="flex gap-3">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm((f) => ({ ...f, mood: m }))}
                  className="w-10 h-10 rounded-xl text-xl transition-all"
                  style={{
                    border: `1px solid ${form.mood === m ? "var(--accent)" : "var(--border)"}`,
                    background:
                      form.mood === m
                        ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                        : "var(--bg-hover)",
                    transform: form.mood === m ? "scale(1.12)" : "scale(1)",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-m)" }}
            >
              {t("prayedToday")}
            </label>
            <div className="flex gap-3 flex-wrap">
              {["Yes", "A little", "Not yet"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setForm((f) => ({ ...f, prayedToday: opt }))}
                  className="px-4 py-2 rounded-xl text-sm transition-all"
                  style={{
                    background:
                      form.prayedToday === opt
                        ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                        : "var(--bg-hover)",
                    border: `1px solid ${form.prayedToday === opt ? "var(--accent)" : "var(--border)"}`,
                    color:
                      form.prayedToday === opt
                        ? "var(--accent)"
                        : "var(--text-b)",
                    fontWeight: form.prayedToday === opt ? 600 : 400,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-m)" }}
            >
              {t("challengeQ")}
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="Describe what challenged you today…"
              value={form.challenge}
              onChange={(e) =>
                setForm((f) => ({ ...f, challenge: e.target.value }))
              }
            />
          </div>
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-m)" }}
            >
              {t("learnedQ")}
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="One thing you learned or noticed today…"
              value={form.learned}
              onChange={(e) =>
                setForm((f) => ({ ...f, learned: e.target.value }))
              }
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              "Saving…"
            ) : (
              <>
                <PenLine size={16} /> {t("saveReflection")}
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ── PROGRESS PAGE ────────────────────────────────────────────────────────────
function ProgressPage() {
  const { profile } = useAuth();
  const streak = profile?.currentStreak || 0;
  const longest = profile?.longestStreak || 0;
  const prayers = profile?.totalPrayersDone || 0;
  const devotions = profile?.totalDevotionsDone || 0;
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const bars = [3, 5, 4, 7, 5, 6, 7, 5];
  return (
    <div className="space-y-5">
      <h2
        className="font-display font-bold text-2xl"
        style={{ color: "var(--text-h)" }}
      >
        My Progress
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Current Streak", value: streak, unit: "days" },
          { label: "Longest Streak", value: longest, unit: "days" },
          { label: "Prayers", value: prayers, unit: "total" },
          { label: "Devotions", value: devotions, unit: "total" },
        ].map((s, i) => (
          <Card key={i} className="text-center py-6">
            <div
              className="font-display font-bold text-4xl mb-1"
              style={{ color: "var(--accent)" }}
            >
              {s.value}
            </div>
            <div
              className="font-semibold text-sm"
              style={{ color: "var(--text-h)" }}
            >
              {s.label}
            </div>
            <div className="text-xs" style={{ color: "var(--text-m)" }}>
              {s.unit}
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <CardLabel>Weekly Activity</CardLabel>
        <div className="flex items-end gap-2 h-28 mt-4">
          {bars.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg"
                style={{
                  height: `${(v / 7) * 100}%`,
                  background:
                    i === bars.length - 1
                      ? "var(--accent)"
                      : "color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
              />
              <span className="text-xs" style={{ color: "var(--text-m)" }}>
                {weeks[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardLabel>Milestones</CardLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "7-Day Streak", done: streak >= 7, emoji: "🔥" },
            { label: "14-Day Streak", done: streak >= 14, emoji: "⭐" },
            { label: "21-Day Streak", done: streak >= 21, emoji: "🏆" },
            {
              label: "10 Reflections",
              done: (profile?.totalReflections || 0) >= 10,
              emoji: "📖",
            },
            { label: "30 Prayers", done: prayers >= 30, emoji: "🙏" },
            {
              label: "Level 3 Growth",
              done: (profile?.growthLevel || 0) >= 3,
              emoji: "🌱",
            },
          ].map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl text-sm"
              style={{
                background: m.done
                  ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                  : "var(--bg-hover)",
                border: `1px solid ${m.done ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "var(--border)"}`,
                color: m.done ? "var(--text-b)" : "var(--text-m)",
              }}
            >
              <span className="text-lg">{m.emoji}</span>
              <span className="text-xs flex-1">{m.label}</span>
              {m.done && (
                <CheckCircle2
                  size={13}
                  style={{ color: "var(--accent2)", flexShrink: 0 }}
                />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── LAYOUT SHELL ─────────────────────────────────────────────────────────────
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
                <Route index element={<DashHomeModule />} />
                <Route path="scripture" element={<ScripturePageModule />} />
                <Route path="prayer" element={<PrayerPageModule />} />
                <Route path="reflection" element={<ReflectionPageModule />} />
                <Route path="history" element={<ReflectionHistory />} />
                <Route path="progress" element={<ProgressPageModule />} />
                <Route path="reminders" element={<RemindersPageModule />} />
                <Route path="community" element={<CommunityFeed />} />
                <Route path="videos" element={<VideoLibrary />} />
                <Route path="pathway" element={<PathwayPageModule />} />
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
