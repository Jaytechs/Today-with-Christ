import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Loader2, Heart, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  subscribeToPrayerRequests,
  subscribeToPrayerPoints,
  addPrayerRequest,
  addPrayerPoint,
  deletePrayerRequest,
  deletePrayerPoint,
  markPrayerAnswered,
  togglePrayedFor,
  SAMPLE_PRAYERS,
} from "../../firebase/firestore";
import {
  Card,
  CardLabel,
  GuestBanner,
  Toast,
} from "../../components/dashboard/DashboardCommon";

const TABS = [
  { id: "guided", label: "Guided Prayer" },
  { id: "requests", label: "Prayer Requests" },
  { id: "points", label: "Prayer Points" },
];

export default function PrayerPage() {
  const { user, profile, canEditContent, isGuest } = useAuth();
  const { t, lang } = useLanguage();
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [prayerPoints, setPrayerPoints] = useState([]);
  const [tab, setTab] = useState("requests");
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
  const toastTimer = useRef(null);

  const prayers = SAMPLE_PRAYERS[lang] || SAMPLE_PRAYERS.en;
  const hour = new Date().getHours();
  const currentSlot = hour < 12 ? "morning" : hour < 17 ? "midday" : "evening";

  useEffect(() => {
    const unsubA = subscribeToPrayerRequests(setPrayerRequests);
    const unsubB = subscribeToPrayerPoints(setPrayerPoints);
    return () => {
      unsubA();
      unsubB();
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }, []);

  const handleAddRequest = useCallback(async () => {
    if (!newRequest.trim()) {
      showToast("Write a prayer request before submitting.", "error");
      return;
    }
    if (!user) {
      showToast("Please sign in to submit prayer requests.", "error");
      return;
    }
    setSaving(true);
    try {
      await addPrayerRequest(user.uid, {
        authorName: isAnon ? "Anonymous" : profile?.fullName || "Member",
        text: newRequest,
        isAnonymous: isAnon,
      });
      setNewRequest("");
      showToast("Prayer request submitted 🙏");
    } catch {
      showToast("Could not submit your request. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }, [isAnon, newRequest, profile?.fullName, showToast, user]);

  const handleAddPoint = useCallback(async () => {
    if (!pointForm.title.trim() || !pointForm.content.trim()) {
      showToast("Please complete the prayer point title and content.", "error");
      return;
    }
    if (!user) {
      showToast("Please sign in to add prayer points.", "error");
      return;
    }
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
    } catch {
      showToast("Could not add prayer point.", "error");
    } finally {
      setSaving(false);
    }
  }, [pointForm, profile?.fullName, showToast, user]);

  const handleTogglePrayed = useCallback(
    async (id) => {
      if (!user) {
        showToast("Please sign in to pray for others.", "error");
        return;
      }
      try {
        await togglePrayedFor(id, user.uid);
      } catch {
        showToast("Could not update prayer status.", "error");
      }
    },
    [showToast, user],
  );

  if (saving && !user) {
    return null;
  }

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      <Toast
        message={toast}
        type={toast.includes("error") ? "error" : "success"}
      />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className="font-display font-bold text-2xl"
          style={{ color: "var(--text-h)" }}
        >
          {t("prayer")}
        </h2>
      </div>

      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: "var(--bg-hover)" }}
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition-all"
            style={{
              background: tab === item.id ? "var(--bg-card)" : "transparent",
              color: tab === item.id ? "var(--accent)" : "var(--text-m)",
              boxShadow:
                tab === item.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

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
            {prayerRequests.length === 0 ? (
              <Card>
                <p
                  className="text-sm text-center py-6"
                  style={{ color: "var(--text-m)" }}
                >
                  No prayer requests yet. Be the first to share. 🙏
                </p>
              </Card>
            ) : (
              prayerRequests.map((req) => (
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
                          color: req.answered
                            ? "var(--text-m)"
                            : "var(--text-b)",
                          textDecoration: req.answered
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {req.text}
                      </p>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <button
                          onClick={() => handleTogglePrayed(req.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={{
                            background: (req.prayedFor || []).includes(
                              user?.uid,
                            )
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
                        {(req.uid === user?.uid ||
                          profile?.role === "admin") && (
                          <button
                            onClick={() => deletePrayerRequest(req.id)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ color: "var(--text-m)" }}
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "points" && (
        <div className="space-y-4">
          {canEditContent && !addingPoint && (
            <button
              onClick={() => setAddingPoint(true)}
              className="btn-secondary text-xs py-2 px-4"
            >
              <Plus size={13} /> Add Prayer Point
            </button>
          )}
          {addingPoint && canEditContent && (
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
                      setPointForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
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
                      setPointForm((prev) => ({
                        ...prev,
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
                        setPointForm((prev) => ({
                          ...prev,
                          slot: e.target.value,
                        }))
                      }
                    >
                      {["general", "morning", "midday", "evening"].map(
                        (slot) => (
                          <option key={slot} value={slot}>
                            {slot.charAt(0).toUpperCase() + slot.slice(1)}
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
                        setPointForm((prev) => ({
                          ...prev,
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

          {prayerPoints.length === 0 ? (
            <Card>
              <p
                className="text-sm text-center py-6"
                style={{ color: "var(--text-m)" }}
              >
                No prayer points yet.{canEditContent ? " Add one above." : ""}
              </p>
            </Card>
          ) : (
            prayerPoints.map((pt) => (
              <Card
                key={pt.id}
                style={{ borderLeft: "4px solid var(--accent)" }}
              >
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
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
