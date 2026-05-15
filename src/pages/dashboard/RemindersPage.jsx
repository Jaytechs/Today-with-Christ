import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getUserReminders,
  saveUserReminders,
  scheduleLocalReminders,
  REMINDER_SLOTS,
} from "../../firebase/firestore";
import {
  Card,
  CardLabel,
  Toast,
} from "../../components/dashboard/DashboardCommon";

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState({
    enabled: false,
    slots: { midnight: false, morning: true, midday: false, evening: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permStatus, setPermStatus] = useState("default");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => {
    if ("Notification" in window) setPermStatus(Notification.permission);
    if (!user) {
      setLoading(false);
      return;
    }
    getUserReminders(user.uid)
      .then((data) => {
        setReminders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => window.clearTimeout(toastTimer.current);
  }, [user]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      showToast("Notifications are not supported in this browser.", "error");
      return;
    }
    const result = await Notification.requestPermission();
    setPermStatus(result);
    if (result === "granted") {
      showToast("Notifications enabled ✓");
    } else {
      showToast("Permission denied. Check browser settings.", "error");
    }
  }, [showToast]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserReminders(user.uid, reminders);
      if (reminders.enabled && permStatus === "granted") {
        scheduleLocalReminders(reminders.slots);
      }
      showToast("Reminder settings saved ✓");
    } catch {
      showToast("Could not save reminders. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }, [permStatus, reminders, showToast, user]);

  const toggleSlot = useCallback((slotId) => {
    setReminders((current) => ({
      ...current,
      slots: { ...current.slots, [slotId]: !current.slots[slotId] },
    }));
  }, []);

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
    <div className="space-y-5 max-w-lg">
      <Toast
        message={toast}
        type={toast.includes("error") ? "error" : "success"}
      />
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
            onClick={() =>
              setReminders((current) => ({
                ...current,
                enabled: !current.enabled,
              }))
            }
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
            <>Save Reminder Settings</>
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
          Reminders are browser notifications. For them to work, you should keep
          the app open in a browser tab or installed as a PWA. Enable multiple
          time slots to cover your full day of prayer.
        </p>
      </div>
    </div>
  );
}
