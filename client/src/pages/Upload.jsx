import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Upload() {
  const navigate = useNavigate();
  const [caption, setCaption] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview(f ? { url: URL.createObjectURL(f), isVideo: f.type.startsWith("video/") } : null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!caption && !file && !externalLink) {
      setError("Add a caption, media, or a link to share.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("caption", caption);
      fd.append("externalLink", externalLink);
      if (file) fd.append("media", file);
      await api.post("/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card composer">
      <h2 style={{ marginBottom: 14 }}>Create a post 🎬</h2>
      <form onSubmit={submit}>
        <textarea
          placeholder="What's on your mind? Share your thoughts…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <div className="field">
          <label>Photo or video (optional)</label>
          <input type="file" accept="image/*,video/*" onChange={pick} />
        </div>

        {preview &&
          (preview.isVideo ? (
            <video src={preview.url} className="post-media" controls />
          ) : (
            <img src={preview.url} className="post-media" alt="preview" />
          ))}

        <div className="field">
          <label>Share an external link (Facebook, Instagram, or any platform)</label>
          <input
            placeholder="https://facebook.com/... or https://instagram.com/..."
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Posting…" : "Share post"}
        </button>
      </form>
    </div>
  );
}
