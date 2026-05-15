import { useState } from "react";
import { Link } from "react-router-dom";
import { PenLine } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  Card,
  CardLabel,
  Toast,
} from "../../components/dashboard/DashboardCommon";

export default function ReflectionPage() {
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
  const [toast, setToast] = useState("");

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

  async function handleSave() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    try {
      const { saveReflection, recordActivity, updateStreak } =
        await import("../../firebase/firestore");
      await saveReflection(user.uid, form);
      await recordActivity(user.uid, "reflection");
      await updateStreak(user.uid);
      setSaved(true);
    } catch (err) {
      console.error("Reflection save failed:", err);
      showToast("Could not save reflection. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <div className="space-y-5 max-w-2xl">
        <Toast message={toast || "Reflection saved ✓"} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <div className="text-5xl">✨</div>
          <h2
            className="font-display font-bold text-2xl"
            style={{ color: "var(--text-h)" }}
          >
            {t("thankYou")}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-b)" }}>
            Come back tomorrow and keep growing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setSaved(false)} className="btn-secondary">
              Write Another
            </button>
            <Link to="/dashboard/history" className="btn-primary">
              View History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const moods = ["😔", "😐", "😌", "😊", "🙏"];

  return (
    <div className="space-y-5 max-w-2xl">
      <Toast
        message={toast}
        type={toast.includes("Could not") ? "error" : "success"}
      />
      <h2
        className="font-display font-bold text-2xl"
        style={{ color: "var(--text-h)" }}
      >
        {t("dailyReflection")}
      </h2>
      <Card>
        <CardLabel icon={PenLine}>Evening Questions</CardLabel>
        <div className="space-y-5">
          <section>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-m)" }}
            >
              {t("howFeeling")}
            </label>
            <div className="flex flex-wrap gap-3">
              {moods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setForm((current) => ({ ...current, mood }))}
                  className="w-10 h-10 rounded-xl text-xl transition-transform"
                  style={{
                    border: `1px solid ${form.mood === mood ? "var(--accent)" : "var(--border)"}`,
                    background:
                      form.mood === mood
                        ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                        : "var(--bg-hover)",
                    transform: form.mood === mood ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  {mood}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-m)" }}
            >
              {t("prayedToday")}
            </label>
            <div className="flex flex-wrap gap-3">
              {["Yes", "A little", "Not yet"].map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setForm((current) => ({ ...current, prayedToday: option }))
                  }
                  className="px-4 py-2 rounded-xl text-sm transition-all"
                  style={{
                    background:
                      form.prayedToday === option
                        ? "color-mix(in srgb, var(--accent) 15%, transparent)"
                        : "var(--bg-hover)",
                    border: `1px solid ${form.prayedToday === option ? "var(--accent)" : "var(--border)"}`,
                    color:
                      form.prayedToday === option
                        ? "var(--accent)"
                        : "var(--text-b)",
                    fontWeight: form.prayedToday === option ? 600 : 400,
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section>
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
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  challenge: event.target.value,
                }))
              }
            />
          </section>

          <section>
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
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  learned: event.target.value,
                }))
              }
            />
          </section>

          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              "Saving…"
            ) : (
              <>
                <PenLine size={16} /> Save Reflection
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}
