// Reliable avatar helpers — fully local, no external service, never 404s.

const COLORS = [
  ["#6d8bff", "#9d6bff"],
  ["#22d3ee", "#6d8bff"],
  ["#37d9a0", "#22d3ee"],
  ["#ff8a5b", "#ff5b7f"],
  ["#9d6bff", "#ff5b7f"],
  ["#f7b955", "#ff8a5b"],
];

const pick = (seed = "?") => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
};

// Generate an inline SVG data-URI avatar with the seed's initial(s).
export const fallbackAvatar = (seed = "User") => {
  const name = String(seed || "User").trim() || "User";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const [c1, c2] = pick(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="128" height="128" fill="url(#g)"/>
  <text x="50%" y="50%" dy=".07em" fill="#fff" font-family="Segoe UI, Arial, sans-serif"
    font-size="54" font-weight="700" text-anchor="middle" dominant-baseline="middle">${initials || "?"}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Returns a usable avatar URL, swapping known-broken defaults for a local one.
export const avatarSrc = (url, seed) => {
  if (
    !url ||
    url.includes("res.cloudinary.com/demo") ||
    url.includes("api.dicebear.com")
  ) {
    return fallbackAvatar(seed);
  }
  return url;
};

// onError handler: replace a failed image with the local fallback (once).
export const onAvatarError = (seed) => (e) => {
  if (e.currentTarget.dataset.fallback) return; // avoid loops
  e.currentTarget.dataset.fallback = "1";
  e.currentTarget.src = fallbackAvatar(seed);
};
