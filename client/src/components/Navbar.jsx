import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import { avatarSrc, onAvatarError } from "../api/avatar";

const links = [
  { to: "/", icon: "🏠", label: "Home" },
  { to: "/upload", icon: "🎬", label: "Create" },
  { to: "/friends", icon: "🤝", label: "Friends" },
  { to: "/chats", icon: "💬", label: "Chats" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [reqCount, setReqCount] = useState(0);

  // fetch pending friend-request count + keep it live
  useEffect(() => {
    const refresh = () =>
      api
        .get("/friends")
        .then((res) => setReqCount(res.data.requests.length))
        .catch(() => {});
    refresh();
    const socket = getSocket();
    socket?.on("friendRequest", refresh);
    socket?.on("friendAccepted", refresh);
    return () => {
      socket?.off("friendRequest", refresh);
      socket?.off("friendAccepted", refresh);
    };
  }, [pathname]);

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <img src="/dep.jpg" className="brand-logo" alt="Depressd logo" />
        <span className="brand-text">Depressd</span>
      </Link>

      <div className="nav-icons">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={pathname === l.to ? "active" : ""}
            title={l.label}
          >
            <span className="nav-emoji">{l.icon}</span>
            <span className="nav-label">{l.label}</span>
            {l.to === "/friends" && reqCount > 0 && (
              <span className="badge">{reqCount}</span>
            )}
          </Link>
        ))}

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle day/night mode"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        <Link
          to="/profile"
          className={`nav-avatar ${pathname.startsWith("/profile") ? "active" : ""}`}
          title="Profile & settings"
        >
          {user?.avatar ? (
            <img
              src={avatarSrc(user.avatar, user.name)}
              onError={onAvatarError(user.name)}
              className="avatar"
              width={30}
              height={30}
              alt="me"
            />
          ) : (
            "👤"
          )}
        </Link>
      </div>
    </nav>
  );
}
