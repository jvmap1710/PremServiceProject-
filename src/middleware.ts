import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // 🚨 SECURITY WARNING: '/api' is excluded from middleware protection to prevent HTML redirects on unauthorized API calls.
  // 🚨 You MUST explicitly call `await auth()` inside EVERY /api route handler to secure them!
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
