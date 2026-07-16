import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import { avatarSrc, onAvatarError } from "../api/avatar";
import { useAuth } from "../context/AuthContext";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupSettings from "../components/GroupSettings";

export default function Chats() {
  const { user } = useAuth();
  const [tab, setTab] = useState("direct"); // direct | groups
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [online, setOnline] = useState([]);
  const [active, setActive] = useState(null); // { kind: 'direct'|'group', data }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const typingTimer = useRef(null);

  const isGroup = active?.kind === "group";
  const activeId = active?.data?._id;

  // Load user + group lists
  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data)).catch(() => {});
    api.get("/groups").then((res) => setGroups(res.data)).catch(() => {});
  }, []);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onOnline = (ids) => setOnline(ids);

    const onNewDirect = (msg) => {
      if (isGroup) return;
      const other = activeId;
      if (
        other &&
        ((msg.sender === other && msg.receiver === user._id) ||
          (msg.sender === user._id && msg.receiver === other))
      ) {
        setMessages((m) => [...m, msg]);
      }
    };

    const onNewGroup = (msg) => {
      if (isGroup && msg.group === activeId) {
        setMessages((m) => [...m, msg]);
      }
    };

    const onTyping = ({ from }) => {
      if (!isGroup && from === activeId) showTyping("typing…");
    };
    const onTypingGroup = ({ group, from, name }) => {
      if (isGroup && group === activeId && from !== user._id) {
        showTyping(`${name || "Someone"} is typing…`);
      }
    };

    socket.on("onlineUsers", onOnline);
    socket.on("newMessage", onNewDirect);
    socket.on("newGroupMessage", onNewGroup);
    socket.on("typing", onTyping);
    socket.on("typingGroup", onTypingGroup);
    return () => {
      socket.off("onlineUsers", onOnline);
      socket.off("newMessage", onNewDirect);
      socket.off("newGroupMessage", onNewGroup);
      socket.off("typing", onTyping);
      socket.off("typingGroup", onTypingGroup);
    };
  }, [active, user._id, isGroup, activeId]);

  const showTyping = (label) => {
    setTyping(label);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(""), 1600);
  };

  // Load conversation when a chat is selected
  useEffect(() => {
    if (!active) return;
    setMessages([]);
    const url = isGroup
      ? `/groups/${activeId}/messages`
      : `/messages/${activeId}`;
    api.get(url).then((res) => setMessages(res.data)).catch(() => {});
  }, [active, isGroup, activeId]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const openDirect = (u) => setActive({ kind: "direct", data: u });
  const openGroup = (g) => {
    getSocket()?.emit("joinGroup", g._id);
    setActive({ kind: "group", data: g });
  };

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const socket = getSocket();
    if (isGroup) {
      socket?.emit("sendGroupMessage", { group: activeId, text });
    } else {
      socket?.emit("sendMessage", { receiver: activeId, text });
    }
    setText("");
  };

  // upload an image then send it as a message
  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !active) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) return alert("Please choose an image.");
    if (file.size > 5 * 1024 * 1024) return alert("Image must be under 5 MB.");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/messages/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const socket = getSocket();
      if (isGroup) {
        socket?.emit("sendGroupMessage", { group: activeId, image: res.data.url });
      } else {
        socket?.emit("sendMessage", { receiver: activeId, image: res.data.url });
      }
    } catch (err) {
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onType = (e) => {
    setText(e.target.value);
    const socket = getSocket();
    if (isGroup) socket?.emit("typingGroup", { group: activeId, name: user.name });
    else socket?.emit("typing", { receiver: activeId });
  };

  const onGroupCreated = (group) => {
    setGroups((g) => [group, ...g]);
    setShowCreate(false);
    setTab("groups");
    openGroup(group);
  };

  const onGroupUpdated = (group) => {
    setGroups((gs) => gs.map((g) => (g._id === group._id ? group : g)));
    if (isGroup && activeId === group._id) {
      setActive({ kind: "group", data: group });
    }
  };

  const onGroupLeft = (groupId) => {
    setGroups((gs) => gs.filter((g) => g._id !== groupId));
    setShowSettings(false);
    setActive(null);
  };

  // sender label for group messages (name of whoever sent it)
  const senderName = (m) =>
    typeof m.sender === "object" ? m.sender?.name : "";
  const senderAvatar = (m) =>
    typeof m.sender === "object" ? m.sender?.avatar : "";
  const senderId = (m) => (typeof m.sender === "object" ? m.sender?._id : m.sender);

  return (
    <div className="chat-grid">
      <div className="card chat-users">
        <div className="chat-tabs">
          <button
            className={tab === "direct" ? "active" : ""}
            onClick={() => setTab("direct")}
          >
            💬 Direct
          </button>
          <button
            className={tab === "groups" ? "active" : ""}
            onClick={() => setTab("groups")}
          >
            👥 Groups
          </button>
        </div>

        {tab === "direct" &&
          users.map((u) => (
            <div
              key={u._id}
              className={`chat-user ${!isGroup && activeId === u._id ? "active" : ""}`}
              onClick={() => openDirect(u)}
            >
              <img
                src={avatarSrc(u.avatar, u.name)}
                onError={onAvatarError(u.name)}
                className="avatar"
                width={38}
                height={38}
                alt=""
              />
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <div className="muted" style={{ fontSize: 11 }}>{u.occupation}</div>
              </div>
              {online.includes(u._id) && <span className="online-dot" />}
            </div>
          ))}

        {tab === "direct" && users.length === 0 && (
          <p className="muted" style={{ padding: 8 }}>No other users yet.</p>
        )}

        {tab === "groups" && (
          <>
            <button
              className="btn create-group-btn"
              onClick={() => setShowCreate(true)}
            >
              + Create group
            </button>
            {groups.map((g) => (
              <div
                key={g._id}
                className={`chat-user ${isGroup && activeId === g._id ? "active" : ""}`}
                onClick={() => openGroup(g)}
              >
                <img
                  src={avatarSrc(g.avatar, g.name)}
                  onError={onAvatarError(g.name)}
                  className="avatar"
                  width={38}
                  height={38}
                  alt=""
                />
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>
                    {g.members?.length || 0} members
                  </div>
                </div>
              </div>
            ))}
            {groups.length === 0 && (
              <p className="muted" style={{ padding: 8 }}>
                No groups yet. Create one!
              </p>
            )}
          </>
        )}
      </div>

      <div className="card chat-main">
        {!active ? (
          <div className="center-loading" style={{ minHeight: "auto", flex: 1 }}>
            Select a chat to start messaging 💬
          </div>
        ) : (
          <>
            <div
              className="row spread"
              style={{ paddingBottom: 8, borderBottom: "1px solid var(--border)" }}
            >
              <div className="row">
                <img
                  src={avatarSrc(active.data.avatar, active.data.name)}
                  onError={onAvatarError(active.data.name)}
                  className="avatar"
                  width={38}
                  height={38}
                  alt=""
                />
                <div>
                  <b>{active.data.name}</b>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {isGroup
                      ? `${active.data.members?.length || 0} members`
                      : online.includes(activeId)
                      ? "🟢 Online"
                      : "Offline"}
                  </div>
                </div>
              </div>
              {isGroup && (
                <button
                  className="btn-ghost"
                  style={{ padding: "8px 12px" }}
                  onClick={() => setShowSettings(true)}
                  title="Group settings"
                >
                  ⚙ Settings
                </button>
              )}
            </div>

            <div className="chat-messages">
              {messages.map((m) => {
                const mine = senderId(m) === user._id;
                return (
                  <div
                    key={m._id}
                    className={`msg ${mine ? "me" : "them"} ${m.image ? "msg-img" : ""}`}
                  >
                    {isGroup && !mine && (
                      <div className="msg-sender">{senderName(m)}</div>
                    )}
                    {m.image && (
                      <a href={m.image} target="_blank" rel="noreferrer">
                        <img src={m.image} className="msg-image" alt="shared" />
                      </a>
                    )}
                    {m.text}
                  </div>
                );
              })}
              {typing && <div className="msg them">{typing}</div>}
              <div ref={endRef} />
            </div>

            <form className="chat-input" onSubmit={send}>
              <button
                type="button"
                className="attach-btn"
                title="Send an image"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "⏳" : "📎"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={sendImage}
              />
              <input placeholder="Type a message…" value={text} onChange={onType} />
              <button className="btn">Send</button>
            </form>
          </>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal
          onCreated={onGroupCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
      {showSettings && isGroup && (
        <GroupSettings
          group={active.data}
          onUpdated={onGroupUpdated}
          onLeft={onGroupLeft}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
