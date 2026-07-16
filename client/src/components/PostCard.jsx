import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { avatarSrc, onAvatarError } from "../api/avatar";
import { useAuth } from "../context/AuthContext";

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [shares, setShares] = useState(post.shares || 0);
  const [text, setText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const liked = likes.some((l) => (l._id || l) === user._id);

  const toggleLike = async () => {
    const res = await api.put(`/posts/${post._id}/like`);
    setLikes(res.data.likes);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await api.post(`/posts/${post._id}/comment`, { text });
    setComments(res.data);
    setText("");
  };

  const share = async () => {
    const res = await api.put(`/posts/${post._id}/share`);
    setShares(res.data.shares);
    const url = post.externalLink || location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      /* clipboard may be blocked */
    }
  };

  const del = async () => {
    if (!confirm("Delete this post?")) return;
    await api.delete(`/posts/${post._id}`);
    onDelete?.(post._id);
  };

  const a = post.author || {};

  return (
    <div className="card post">
      <div className="post-head">
        <Link to={`/profile/${a._id}`}>
          <img
            src={avatarSrc(a.avatar, a.name)}
            onError={onAvatarError(a.name)}
            className="avatar"
            width={44}
            height={44}
            alt=""
          />
        </Link>
        <div className="grow">
          <Link to={`/profile/${a._id}`} style={{ color: "var(--text)", fontWeight: 600 }}>
            {a.name}
          </Link>
          <div className="muted" style={{ fontSize: 12 }}>
            {a.occupation} · {new Date(post.createdAt).toLocaleString()}
          </div>
        </div>
        {a._id === user._id && (
          <button className="btn-ghost" style={{ padding: "4px 10px" }} onClick={del}>
            🗑
          </button>
        )}
      </div>

      {post.caption && <p style={{ whiteSpace: "pre-wrap" }}>{post.caption}</p>}

      {post.mediaType === "image" && (
        <img src={post.mediaUrl} className="post-media" alt="" />
      )}
      {post.mediaType === "video" && (
        <video src={post.mediaUrl} className="post-media" controls />
      )}

      {post.externalLink && (
        <a href={post.externalLink} target="_blank" rel="noreferrer" className="ext-link">
          🔗 Shared link: {post.externalLink.slice(0, 48)}
        </a>
      )}

      <div className="post-actions">
        <button className={liked ? "liked" : ""} onClick={toggleLike}>
          {liked ? "❤️" : "🤍"} {likes.length} Like
        </button>
        <button onClick={() => setShowComments((s) => !s)}>
          💬 {comments.length} Comment
        </button>
        <button onClick={share}>↗ {shares} Share</button>
      </div>

      {showComments && (
        <div style={{ marginTop: 8 }}>
          {comments.map((c) => (
            <div className="comment" key={c._id}>
              <img
                src={avatarSrc(c.user?.avatar, c.user?.name)}
                onError={onAvatarError(c.user?.name)}
                className="avatar"
                width={30}
                height={30}
                alt=""
              />
              <div className="bubble">
                <b style={{ fontSize: 13 }}>{c.user?.name}</b>
                <div>{c.text}</div>
              </div>
            </div>
          ))}
          <form className="chat-input" onSubmit={addComment} style={{ marginTop: 10 }}>
            <input
              placeholder="Write a supportive comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
