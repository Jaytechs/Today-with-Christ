import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { createVideo, VIDEO_CATEGORIES } from "../../firebase/firestore";

export default function VideoUploadForm({ user, onUpload }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: VIDEO_CATEGORIES[0] || "Faith",
    videoUrl: "",
    thumbnailUrl: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!form.title.trim() || !form.videoUrl.trim()) return;
    setSaving(true);
    try {
      const video = await createVideo(user.uid, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        videoUrl: form.videoUrl.trim(),
        thumbnailUrl:
          form.thumbnailUrl.trim() ||
          "https://via.placeholder.com/640x360?text=Video",
        uploadedBy: user.displayName || "Mentor",
      });
      onUpload(video);
      setForm({
        title: "",
        description: "",
        category: VIDEO_CATEGORIES[0] || "Faith",
        videoUrl: "",
        thumbnailUrl: "",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3
            className="font-semibold text-lg"
            style={{ color: "var(--text-h)" }}
          >
            {t("uploadVideo")}
          </h3>
          <p className="text-sm" style={{ color: "var(--text-m)" }}>
            {t("uploadNote")}
          </p>
        </div>
        <UploadCloud size={22} style={{ color: "var(--accent)" }} />
      </div>

      <div className="grid gap-3">
        <input
          className="input-field"
          placeholder={t("videoTitle")}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          className="input-field resize-none"
          rows={3}
          placeholder={t("videoDescription")}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
            className="input-field"
          >
            {VIDEO_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            className="input-field"
            placeholder={t("thumbnailUrl")}
            value={form.thumbnailUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))
            }
          />
        </div>
        <input
          className="input-field"
          placeholder={t("videoUrl")}
          value={form.videoUrl}
          onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
        />
        <button
          onClick={handleSubmit}
          disabled={saving || !form.title.trim() || !form.videoUrl.trim()}
          className="btn-primary w-fit"
        >
          {saving ? t("uploading") : t("uploadVideo")}
        </button>
      </div>
    </div>
  );
}
