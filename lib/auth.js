// Simple single-password protection.
// The password lives in the APP_PASSWORD environment variable (set it in Vercel),
// never in the code. After logging in, the browser keeps a cookie holding a hash
// of the password, so changing APP_PASSWORD logs everyone out.

export const COOKIE_NAME = "hoh_auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getPassword() {
  return process.env.APP_PASSWORD || "";
}

// Works in both middleware (edge) and route handlers (node).
export async function tokenFor(password) {
  const data = new TextEncoder().encode(`hoh-profit-calculator:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Compare two strings without leaking where they differ via timing.
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
