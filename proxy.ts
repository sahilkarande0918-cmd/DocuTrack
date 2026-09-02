import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next 16 "proxy" convention (formerly middleware). Route protection is defined
// by the `authorized` callback in auth.config.ts.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/student/:path*", "/faculty/:path*", "/admin/:path*"],
};
