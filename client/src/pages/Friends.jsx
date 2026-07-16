import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import { avatarSrc, onAvatarError } from "../api/avatar";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const [f, s] = await Promise.all([
      api.get("/friends"),
      api.get("/friends/suggestions"),
    ]);
    setFriends(f.data.friends);
    setRequests(f.data.requests);
    setSent(f.data.sent);
    setSuggestions(s.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    if (!socket) return;
    const reload = () => load();
    socket.on("friendRequest", reload);
    socket.on("friendAccepted", reload);
    return () => {
      socket.off("friendRequest", reload);
      socket.off("friendAccepted", reload);
    };
  }, []);

  const act = async (fn, id) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const sendReq = (id) => act(() => api.post(`/friends/request/${id}`), id);
  const accept = (id) => act(() => api.post(`/friends/accept/${id}`), id);
  const reject = (id) => act(() => api.post(`/friends/reject/${id}`), id);
  const cancel = (id) => act(() => api.post(`/friends/cancel/${id}`), id);
  const unfriend = (id) => act(() => api.delete(`/friends/${id}`), id);

  const Person = ({ u, children }) => (
    <div className="friend-card">
      <Link to={`/profile/${u._id}`}>
        <img
          src={avatarSrc(u.avatar, u.name)}
          onError={onAvatarError(u.name)}
          className="avatar"
          width={52}
          height={52}
          alt=""
        />
      </Link>
      <div className="grow" style={{ overflow: "hidden" }}>
        <Link to={`/profile/${u._id}`} style={{ color: "var(--text)", fontWeight: 600 }}>
          {u.name}
        </Link>
        <div className="muted" style={{ fontSize: 12 }}>{u.occupation}</div>
      </div>
      <div className="friend-actions">{children}</div>
    </div>
  );

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h2 style={{ margin: "4px 0 16px" }}>Friends 🤝</h2>

      {/* Incoming requests */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="section-title">
          Friend Requests {requests.length > 0 && <span className="count">{requests.length}</span>}
        </h3>
        {requests.length === 0 && <p className="muted">No pending requests.</p>}
        {requests.map((u) => (
          <Person key={u._id} u={u}>
            <button className="btn" disabled={busyId === u._id} onClick={() => accept(u._id)}>
              Confirm
            </button>
            <button className="btn-ghost" disabled={busyId === u._id} onClick={() => reject(u._id)}>
              Delete
            </button>
          </Person>
        ))}
      </div>

      {/* Suggestions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="section-title">People you may know</h3>
        {suggestions.length === 0 && <p className="muted">No suggestions right now.</p>}
        {suggestions.map((u) => (
          <Person key={u._id} u={u}>
            <button className="btn" disabled={busyId === u._id} onClick={() => sendReq(u._id)}>
              ➕ Add friend
            </button>
          </Person>
        ))}
      </div>

      {/* Sent requests */}
      {sent.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">Sent Requests</h3>
          {sent.map((u) => (
            <Person key={u._id} u={u}>
              <button className="btn-ghost" disabled={busyId === u._id} onClick={() => cancel(u._id)}>
                Cancel
              </button>
            </Person>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div className="card">
        <h3 className="section-title">
          Your Friends {friends.length > 0 && <span className="count">{friends.length}</span>}
        </h3>
        {friends.length === 0 && <p className="muted">No friends yet. Send some requests!</p>}
        {friends.map((u) => (
          <Person key={u._id} u={u}>
            <Link to="/chats">
              <button className="btn-ghost">💬 Message</button>
            </Link>
            <button className="btn-ghost" disabled={busyId === u._id} onClick={() => unfriend(u._id)}>
              Unfriend
            </button>
          </Person>
        ))}
      </div>
    </div>
  );
}
