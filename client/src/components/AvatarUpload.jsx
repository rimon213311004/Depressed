import { useRef, useState } from "react";
import api from "../api/axios";
import { avatarSrc, onAvatarError } from "../api/avatar";

/**
 * Avatar uploader with instant preview, upload progress, validation.
 * Calls onUpdated(user) with the fresh user after a successful upload.
 */
export default function AvatarUpload({ avatar, onUpdated }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    // instant local preview
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.put("/users/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUpdated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Try again.");
      setPreview(null);
    } finally {
      setBusy(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-ring" onClick={pick} title="Change profile picture">
        <img
          src={preview || avatarSrc(avatar, "me")}
          onError={onAvatarError("me")}
          className="avatar avatar-lg"
          alt="profile"
          style={busy ? { filter: "brightness(0.5)" } : undefined}
        />
        <span className="avatar-cam">{busy ? "⏳" : "📷"}</span>
        {busy && <span className="avatar-uploading">Uploading…</span>}
      </div>
      <button type="button" className="btn-ghost avatar-btn" onClick={pick} disabled={busy}>
        {busy ? "Uploading…" : "Change photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />
      {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
