import { useEffect, useState } from "react";
import api from "../api/axios";
import { avatarSrc, onAvatarError } from "../api/avatar";
import { useAuth } from "../context/AuthContext";

/**
 * Group settings panel: view members, add new members (admin), leave group.
 * onUpdated(group) after member changes; onLeft(groupId) after leaving; onClose().
 */
export default function GroupSettings({ group, onUpdated, onLeft, onClose }) {
  const { user } = useAuth();
  const [detail, setDetail] = useState(group);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const isAdmin = String(detail.admin?._id || detail.admin) === user._id;

  useEffect(() => {
    // refresh full group + list of users not already in it
    api.get(`/groups/${group._id}`).then((res) => setDetail(res.data)).catch(() => {});
    api.get("/users").then((res) => setCandidates(res.data)).catch(() => {});
  }, [group._id]);

  const memberIds = new Set((detail.members || []).map((m) => String(m._id || m)));
  const addable = candidates.filter((u) => !memberIds.has(u._id));

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const addMembers = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const res = await api.put(`/groups/${group._id}/members`, {
        members: [...selected],
      });
      setDetail(res.data);
      setSelected(new Set());
      onUpdated?.(res.data);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!confirm("Leave this group?")) return;
    setBusy(true);
    try {
      await api.put(`/groups/${group._id}/leave`);
      onLeft?.(group._id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="row spread" style={{ marginBottom: 14 }}>
          <div className="row">
            <img
              src={avatarSrc(detail.avatar, detail.name)}
              onError={onAvatarError(detail.name)}
              className="avatar"
              width={48}
              height={48}
              alt=""
            />
            <div>
              <h2 style={{ fontSize: 20 }}>{detail.name}</h2>
              <div className="muted" style={{ fontSize: 12 }}>
                {detail.members?.length || 0} members
              </div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 12px" }} onClick={onClose}>
            ✕
          </button>
        </div>

        <h3 className="section-title">Members</h3>
        <div className="member-list" style={{ marginBottom: 16 }}>
          {(detail.members || []).map((m) => (
            <div className="member-item" key={m._id}>
              <img
                src={avatarSrc(m.avatar, m.name)}
                onError={onAvatarError(m.name)}
                className="avatar"
                width={34}
                height={34}
                alt=""
              />
              <div className="grow">
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {m.name} {String(m._id) === user._id && "(You)"}
                </div>
                <div className="muted" style={{ fontSize: 11 }}>{m.occupation}</div>
              </div>
              {String(detail.admin?._id || detail.admin) === String(m._id) && (
                <span className="pill">👑 Admin</span>
              )}
            </div>
          ))}
        </div>

        {isAdmin && addable.length > 0 && (
          <>
            <h3 className="section-title">Add members</h3>
            <div className="member-list">
              {addable.map((u) => (
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
            <button
              className="btn"
              style={{ width: "100%", marginTop: 12 }}
              disabled={busy || selected.size === 0}
              onClick={addMembers}
            >
              Add {selected.size > 0 ? `${selected.size} ` : ""}member
              {selected.size !== 1 ? "s" : ""}
            </button>
          </>
        )}

        <button
          className="btn btn-danger"
          style={{ width: "100%", marginTop: 12 }}
          disabled={busy}
          onClick={leave}
        >
          🚪 Leave group
        </button>
      </div>
    </div>
  );
}
