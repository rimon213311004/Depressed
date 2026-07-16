import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { avatarSrc, onAvatarError } from "../api/avatar";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import AvatarUpload from "../components/AvatarUpload";

export default function Profile() {
  const { id } = useParams();
  const { user, updateUser, logout } = useAuth();
  const isMe = !id || id === user._id;
  const [profile, setProfile] = useState(isMe ? user : null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const uid = id || user._id;
    if (!isMe) {
      api.get(`/users/${uid}`).then((res) => setProfile(res.data));
    } else {
      setProfile(user);
    }
    api.get(`/posts/user/${uid}`).then((res) => setPosts(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const startEdit = () => {
    setForm({
      name: profile.name,
      occupation: profile.occupation,
      age: profile.age,
      bio: profile.bio || "",
      facebook: profile.socialLinks?.facebook || "",
      instagram: profile.socialLinks?.instagram || "",
    });
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/users/profile", { ...form, age: Number(form.age) });
      updateUser(res.data);
      setProfile(res.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const applyUser = (u) => {
    updateUser(u);
    setProfile(u);
  };

  const removePost = (pid) => setPosts((p) => p.filter((x) => x._id !== pid));

  if (!profile) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="card">
        <div className="row spread" style={{ alignItems: "flex-start" }}>
          <div className="profile-head">
            {isMe ? (
              <AvatarUpload avatar={profile.avatar} onUpdated={applyUser} />
            ) : (
              <img
                src={avatarSrc(profile.avatar, profile.name)}
                onError={onAvatarError(profile.name)}
                className="avatar avatar-lg"
                alt=""
              />
            )}
            <div>
              <h2>{profile.name}</h2>
              <div className="muted">{profile.occupation} · Age {profile.age}</div>
              {profile.bio && <p style={{ marginTop: 6 }}>{profile.bio}</p>}
            </div>
          </div>
          {isMe && (
            <button className="btn-ghost" onClick={logout} style={{ padding: "8px 14px" }}>
              Logout
            </button>
          )}
        </div>

        {/* social links */}
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          {profile.socialLinks?.facebook && (
            <a className="pill" href={profile.socialLinks.facebook} target="_blank" rel="noreferrer">
              📘 Facebook
            </a>
          )}
          {profile.socialLinks?.instagram && (
            <a className="pill" href={profile.socialLinks.instagram} target="_blank" rel="noreferrer">
              📸 Instagram
            </a>
          )}
        </div>

        {isMe && !editing && (
          <div className="row" style={{ marginTop: 14, gap: 8 }}>
            <button className="btn" onClick={startEdit}>
              ⚙ Edit profile & settings
            </button>
          </div>
        )}

        {isMe && editing && (
          <form onSubmit={save} style={{ marginTop: 16 }}>
            <div className="field">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Occupation</label>
              <input
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Facebook link</label>
              <input
                value={form.facebook}
                onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Instagram link</label>
              <input
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <h3 style={{ margin: "18px 0 12px" }}>Posts</h3>
      {posts.length === 0 && <p className="muted">No posts yet.</p>}
      {posts.map((p) => (
        <PostCard key={p._id} post={p} onDelete={removePost} />
      ))}
    </div>
  );
}
