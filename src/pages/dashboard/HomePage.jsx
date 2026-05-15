import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, PenLine, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  getTodaysDevotion,
  getTodaysPrayer,
  getTodayProgress,
  recordActivity,
  updateStreak,
  SAMPLE_DEVOTIONS,
  SAMPLE_PRAYERS,
} from "../../firebase/firestore";
import {
  Card,
  CardLabel,
  GuestBanner,
  Toast,
} from "../../components/dashboard/DashboardCommon";

function greeting(t) {
  const hour = new Date().getHours();
  if (hour < 12) return t("greeting");
  if (hour < 17) return t("greetingAfternoon");
  return t("greetingEvening");
}

export default function HomePage() {
  const { user, profile, refreshProfile, isGuest, canInteract } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [devotion, setDevotion] = useState(null);
  const [prayer, setPrayer] = useState(null);
  const [completed, setCompleted] = useState({
    devotion: false,
    prayer: false,
    reflection: false,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const isMounted = useRef(true);

  const todayFocus = useMemo(() => {
    const focuses = [
      "Faith",
      "Prayer",
      "Discipline",
      "Purpose",
      "Humility",
      "Gratitude",
      "Leadership",
    ];
    return focuses[new Date().getDay()];
  }, []);

  const prayerSlot = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Morning" : hour < 17 ? "Midday" : "Evening";
  }, []);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);

    const load = async () => {
      try {
        const [dev, pray, progress] = await Promise.all([
          getTodaysDevotion(lang),
          getTodaysPrayer(lang),
          user
            ? getTodayProgress(user.uid)
            : Promise.resolve({
                devotion: false,
                prayer: false,
                reflection: false,
              }),
        ]);
        if (!isMounted.current) return;
        setDevotion(dev);
        setPrayer(pray);
        setCompleted(progress);
      } catch {
        if (!isMounted.current) return;
        const devs = SAMPLE_DEVOTIONS[lang] || SAMPLE_DEVOTIONS.en;
        const prayers = SAMPLE_PRAYERS[lang] || SAMPLE_PRAYERS.en;
        const hour = new Date().getHours();
        const slot = hour < 12 ? "morning" : hour < 17 ? "midday" : "evening";
        setDevotion(devs[0]);
        setPrayer(prayers[slot] || prayers.morning);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted.current = false;
      window.clearTimeout(toastTimer.current);
    };
  }, [lang, user]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }, []);

  const markComplete = useCallback(
    async (type) => {
      if (!canInteract) {
        navigate("/login");
        return;
      }
      if (completed[type] || !user) return;
      setCompleted((current) => ({ ...current, [type]: true }));
      await recordActivity(user.uid, type);
      const updated = { ...completed, [type]: true };
      if (updated.devotion && updated.prayer && updated.reflection) {
        await updateStreak(user.uid);
        await refreshProfile();
        showToast("Daily flow complete! Streak updated 🔥");
      } else {
        showToast(
          `${type.charAt(0).toUpperCase() + type.slice(1)} marked complete ✓`,
        );
      }
    },
    [completed, canInteract, navigate, refreshProfile, showToast, user],
  );

  const name = useMemo(
    () => profile?.fullName || user?.displayName || "Friend",
    [profile, user],
  );
  const streak = profile?.currentStreak || 0;

  if (loading) {
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
  }

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      <Toast message={toast} />

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
          <BookOpen
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
            {t("focusHint") ||
              "Use this focus word as your anchor for prayer and scripture today."}
          </p>
        </Card>

        {prayer && (
          <Card>
            <CardLabel icon={Heart}>{prayerSlot} Prayer</CardLabel>
            <p className="verse-italic text-base mb-4">"{prayer.prayer}"</p>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <span className="verse-ref">{prayer.title || prayerSlot}</span>
              <span className="card-tag">{prayer.focus || "Prayer"}</span>
            </div>
            <button
              onClick={() => markComplete("prayer")}
              className="btn-primary text-sm py-2 px-4"
              style={{ opacity: completed.prayer ? 0.6 : 1 }}
            >
              {completed.prayer ? "✓ Prayed" : "Mark Prayed"}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
