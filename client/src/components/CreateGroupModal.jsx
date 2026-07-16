import { useEffect, useState } from "react";
import api from "../api/axios";
import { avatarSrc, onAvatarError } from "../api/avatar";

/**
 * Modal to create a group: pick a name + select members from the user list.
 * Calls onCreated(group) when done, onClose() to dismiss.
 */
export default function CreateGroupModal({ onCreated, onClose }) {
  const [name, setName] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const create = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please give your group a name.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/groups", {
        name: name.trim(),
        members: [...selected],
      });
      onCreated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="row spread" style={{ marginBottom: 14 }}>
          <h2>Create a group 👥</h2>
          <button className="btn-ghost" style={{ padding: "6px 12px" }} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={create}>
          <div className="field">
            <label>Group name</label>
            <input
              autoFocus
              placeholder="e.g. Support Circle, Night Owls…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Add members ({selected.size} selected)</label>
            <div className="member-list">
              {users.length === 0 && <p className="muted">No other users yet.</p>}
              {users.map((u) => (
                <div
                  key={u._id}
                  className={`member-item ${selected.has(u._id) ? "sel" : ""}`}
                  onClick={() => toggle(u._id)}
                >
                  <img
                    src={avatarSrc(u.avatar, u.name)}
                    onError={onAvatarError(u.name)}
                    className="avatar"
                    width={34}
                    height={34}
                    alt=""
                  />
                  <div className="grow">
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{u.occupation}</div>
                  </div>
                  <span className="checkmark">{selected.has(u._id) ? "✓" : ""}</span>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button className="btn" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Creating…" : "Create group"}
          </button>
          <p className="muted" style={{ fontSize: 12, marginTop: 8, textAlign: "center" }}>
            You'll be added automatically as the admin.
          </p>
        </form>
      </div>
    </div>
  );
}
