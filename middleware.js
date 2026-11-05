import { NextResponse } from "next/server";
import { COOKIE_NAME, getPassword, tokenFor, safeEqual } from "./lib/auth";

// Every page goes through this check. Without a valid login cookie the
// visitor is sent to /login. If APP_PASSWORD isn't set the site stays locked.
export async function middleware(req) {
  const password = getPassword();
  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  if (password && cookie && safeEqual(cookie, await tokenFor(password))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Protect everything except the login page, its API and Next's static files.
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
