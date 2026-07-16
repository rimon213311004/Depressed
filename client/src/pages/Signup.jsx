import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    occupation: "",
    age: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup({ ...form, age: Number(form.age) });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        <img src="/dep.jpg" className="auth-logo" alt="Depressd" />
        <h1>Depressd 💙</h1>
        <p className="tag">
          A safe space to share, connect, and feel less alone. Create your account.
        </p>

        <div className="field">
          <label>Full name</label>
          <input name="name" value={form.name} onChange={change} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            required
          />
        </div>
        <div className="field">
          <label>Occupation</label>
          <input
            name="occupation"
            value={form.occupation}
            onChange={change}
            placeholder="Student, Teacher, Artist…"
            required
          />
        </div>
        <div className="field">
          <label>Age</label>
          <input
            type="number"
            name="age"
            min="1"
            max="120"
            value={form.age}
            onChange={change}
            required
          />
        </div>
        <div className="field">
          <label>Password (min 6 chars)</label>
          <input
            type="password"
            name="password"
            minLength={6}
            value={form.password}
            onChange={change}
            required
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Creating account…" : "Sign up"}
        </button>
        <p className="muted" style={{ marginTop: 14, textAlign: "center" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
