import { NextResponse } from "next/server";
import { COOKIE_NAME, COOKIE_MAX_AGE, getPassword, tokenFor, safeEqual } from "../../../lib/auth";

export async function POST(req) {
  const password = getPassword();
  if (!password) {
    return NextResponse.json(
      { error: "No password has been set yet. Add APP_PASSWORD in Vercel → Settings → Environment Variables, then redeploy." },
      { status: 500 }
    );
  }

  let attempt = "";
  try {
    ({ password: attempt = "" } = await req.json());
  } catch {}

  const expected = await tokenFor(password);
  const given = await tokenFor(String(attempt));

  if (!safeEqual(given, expected)) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}
