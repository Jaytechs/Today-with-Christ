import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Loader2, RefreshCw, Plus, X, Trash2, BookOpen } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeToScriptures,
  addScripture,
  deleteScripture,
  getScriptureShuffleIndex,
  msUntilNextScriptureRotation,
  SAMPLE_DEVOTIONS,
} from "../../firebase/firestore";
import {
  Card,
  CardLabel,
  GuestBanner,
  Toast,
} from "../../components/dashboard/DashboardCommon";

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

export default function ScripturePage() {
  const { user, canEditContent, isGuest } = useAuth();
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
  const countdownTimer = useRef(null);
  const toastTimer = useRef(null);

  const allScriptures = useMemo(
    () => (scriptures.length > 0 ? scriptures : SAMPLE_DEVOTIONS.en),
    [scriptures],
  );
  const current = allScriptures[idx % allScriptures.length];

  useEffect(() => {
    const unsub = subscribeToScriptures((data) => {
      setScriptures(data);
      setLoading(false);
    });
    return () => {
      unsub();
      window.clearTimeout(timerRef.current);
      window.clearInterval(countdownTimer.current);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!allScriptures.length) return;
    const tick = () => {
      setIdx(getScriptureShuffleIndex(allScriptures.length));
    };
    tick();
    const ms = msUntilNextScriptureRotation();
    timerRef.current = window.setTimeout(function loop() {
      tick();
      timerRef.current = window.setTimeout(loop, 30 * 60 * 1000);
    }, ms);
    return () => window.clearTimeout(timerRef.current);
  }, [allScriptures.length]);

  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    const updateCountdown = () => {
      const ms = msUntilNextScriptureRotation();
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setCountdown(`${m}m ${s}s`);
    };
    updateCountdown();
    countdownTimer.current = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(countdownTimer.current);
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!form.scripture.trim() || !form.reference.trim() || !user) return;
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
    } catch {
      showToast("Unable to save scripture. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }, [form, showToast, user]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Remove this scripture?")) return;
      try {
        await deleteScripture(id);
        showToast("Scripture removed.");
      } catch {
        showToast("Could not remove scripture.", "error");
      }
    },
    [showToast],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2
          size={28}
          className="animate-spin"
          style={{ color: "var(--accent)" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      <Toast
        message={toast}
        type={
          toast.includes("Unable") || toast.includes("Could")
            ? "error"
            : "success"
        }
      />

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
            onClick={() => setShowAdd((current) => !current)}
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
                  setForm((prev) => ({ ...prev, scripture: e.target.value }))
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
                    setForm((prev) => ({ ...prev, reference: e.target.value }))
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
                    setForm((prev) => ({ ...prev, focus: e.target.value }))
                  }
                >
                  {FOCUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
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
                  setForm((prev) => ({ ...prev, devotion: e.target.value }))
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
                  setForm((prev) => ({ ...prev, application: e.target.value }))
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
