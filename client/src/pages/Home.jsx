import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/posts")
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false));
  }, []);

  const removePost = (id) => setPosts((p) => p.filter((x) => x._id !== id));

  return (
    <div>
      <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
        <h2 style={{ marginBottom: 4 }}>You are not alone 💙</h2>
        <p className="muted">
          Share what's on your heart. This community listens.
        </p>
        <Link to="/upload">
          <button className="btn" style={{ marginTop: 12 }}>
            + Create a post
          </button>
        </Link>
      </div>

      {loading && <p className="muted">Loading feed…</p>}
      {!loading && posts.length === 0 && (
        <p className="muted" style={{ textAlign: "center" }}>
          No posts yet. Be the first to share.
        </p>
      )}
      {posts.map((p) => (
        <PostCard key={p._id} post={p} onDelete={removePost} />
      ))}
    </div>
  );
}
