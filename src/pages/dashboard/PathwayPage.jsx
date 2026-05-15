import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus, Trash2, Pencil } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardLabel,
  Toast,
} from "../../components/dashboard/DashboardCommon";
import {
  PATHWAY_LEVELS,
  subscribeToPathwayLevels,
  createPathwayLevel,
  updatePathwayLevel,
  deletePathwayLevel,
  getUserLessonProgress,
} from "../../firebase/firestore";

export default function PathwayPage() {
  const { user, canEditContent } = useAuth();
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

  useEffect(() => {
    const unsub = subscribeToPathwayLevels(setLevels);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserLessonProgress(user.uid).then((progress) => {
      setCompletedIds(
        new Set(
          progress
            .filter((item) => item.completed)
            .map((item) => item.lessonId),
        ),
      );
    });
  }, [user]);

  function showNotification(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  }

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
        showNotification("Level updated ✓");
      } else {
        await createPathwayLevel(levelForm);
        showNotification("New pathway level added ✓");
      }
      setShowAddLevel(false);
      setEditingLevel(null);
      setLevelForm({ title: "", description: "", color: "#D4A373" });
    } catch (error) {
      console.error(error);
      showNotification("Unable to save level. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLevel(level) {
    if (
      !window.confirm(
        `Delete "${level.title}" and its lessons? This cannot be undone.`,
      )
    )
      return;
    try {
      await deletePathwayLevel(level.id, level.level ?? level.order ?? 0);
      showNotification("Level deleted.");
    } catch (error) {
      console.error(error);
      showNotification("Could not delete level.");
    }
  }

  function startEdit(level) {
    setEditingLevel(level);
    setLevelForm({
      title: level.title,
      description: level.description || "",
      color: level.color || "#D4A373",
    });
    setShowAddLevel(true);
  }

  const presetColors = [
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
    <div className="space-y-6 max-w-3xl">
      <Toast message={toast} />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="font-display font-bold text-2xl"
            style={{ color: "var(--text-h)" }}
          >
            Growth Pathway
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-m)" }}>
            Click a level to read teachings, complete lessons, and track
            progress.
          </p>
        </div>
        {canEditContent && (
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowAddLevel(true)}
          >
            <Plus size={14} /> Add Level
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {levels.map((level) => (
          <Card
            key={level.id || level.title}
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <Link
                  to={`/dashboard/pathway/${level.level ?? level.order ?? 0}`}
                  className="block"
                >
                  <div
                    className="font-semibold text-lg"
                    style={{ color: "var(--text-h)" }}
                  >
                    {level.title}
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-m)" }}
                  >
                    {level.description}
                  </p>
                </Link>
                <div
                  className="text-xs text-muted"
                  style={{ color: "var(--text-m)" }}
                >
                  {completedIds.size} lessons completed
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEditContent && (
                  <>
                    <button
                      onClick={() => startEdit(level)}
                      className="btn-secondary text-xs px-3 py-2"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLevel(level)}
                      className="btn-danger text-xs px-3 py-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
                <ChevronRight size={16} style={{ color: "var(--text-m)" }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showAddLevel && (
        <Card>
          <CardLabel>
            {editingLevel ? "Edit Pathway Level" : "Create a New Level"}
          </CardLabel>
          <div className="space-y-4">
            <label className="block text-xs uppercase tracking-wider text-slate-500">
              Title
            </label>
            <input
              value={levelForm.title}
              onChange={(event) =>
                setLevelForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="input-field w-full"
              placeholder="Level title"
            />
            <label className="block text-xs uppercase tracking-wider text-slate-500">
              Description
            </label>
            <textarea
              value={levelForm.description}
              onChange={(event) =>
                setLevelForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="input-field w-full resize-none"
              rows={3}
              placeholder="Overview of this level"
            />
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                Color
              </div>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setLevelForm((current) => ({ ...current, color }))
                    }
                    className="w-8 h-8 rounded-full border"
                    style={{
                      background: color,
                      borderColor:
                        levelForm.color === color
                          ? "var(--accent)"
                          : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveLevel}
                disabled={saving}
                className="btn-primary"
              >
                {saving
                  ? "Saving…"
                  : editingLevel
                    ? "Update Level"
                    : "Create Level"}
              </button>
              <button
                onClick={() => {
                  setShowAddLevel(false);
                  setEditingLevel(null);
                  setLevelForm({
                    title: "",
                    description: "",
                    color: "#D4A373",
                  });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
