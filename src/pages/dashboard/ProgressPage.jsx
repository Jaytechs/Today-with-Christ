import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardLabel } from "../../components/dashboard/DashboardCommon";

export default function ProgressPage() {
  const { profile } = useAuth();
  const streak = profile?.currentStreak || 0;
  const longest = profile?.longestStreak || 0;
  const prayers = profile?.totalPrayersDone || 0;
  const devotions = profile?.totalDevotionsDone || 0;
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
  const bars = [3, 5, 4, 7, 5, 6, 7, 5];

  const milestones = [
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
  ];

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
        ].map((metric, index) => (
          <Card key={index} className="text-center py-6">
            <div
              className="font-display font-bold text-4xl mb-1"
              style={{ color: "var(--accent)" }}
            >
              {metric.value}
            </div>
            <div
              className="font-semibold text-sm"
              style={{ color: "var(--text-h)" }}
            >
              {metric.label}
            </div>
            <div className="text-xs" style={{ color: "var(--text-m)" }}>
              {metric.unit}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardLabel>Weekly Activity</CardLabel>
        <div className="flex items-end gap-2 h-28 mt-4">
          {bars.map((value, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t-lg"
                style={{
                  height: `${(value / 7) * 100}%`,
                  background:
                    index === bars.length - 1
                      ? "var(--accent)"
                      : "color-mix(in srgb, var(--accent) 25%, transparent)",
                }}
              />
              <span className="text-xs" style={{ color: "var(--text-m)" }}>
                {weeks[index]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardLabel>Milestones</CardLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl text-sm"
              style={{
                background: milestone.done
                  ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                  : "var(--bg-hover)",
                border: milestone.done
                  ? "1px solid color-mix(in srgb, var(--accent) 25%, transparent)"
                  : "1px solid var(--border)",
                color: milestone.done ? "var(--text-b)" : "var(--text-m)",
              }}
            >
              <span className="text-lg">{milestone.emoji}</span>
              <span className="text-xs flex-1">{milestone.label}</span>
              {milestone.done && (
                <CheckCircle2 size={13} style={{ color: "var(--accent2)" }} />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
