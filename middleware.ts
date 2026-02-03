import { NextResponse, type NextRequest } from "next/server";
import {
  REGISTERED_EMAIL_COOKIE_NAME,
  shouldProtectPath,
} from "@/constants/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const registeredEmail = request.cookies.get(REGISTERED_EMAIL_COOKIE_NAME)?.value;

  if (pathname === "/" && registeredEmail) {
    return NextResponse.redirect(new URL("/capture", request.url));
  }

  if (shouldProtectPath(pathname) && !registeredEmail) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
