import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
import type { AuthUser } from "@/types";

// P1 1.3: backend JWTs are NOT serialised into the next-auth session
// cookie. They ride in dedicated HttpOnly ``sathi_at`` / ``sathi_rt``
// cookies set by the BFF auth routes. Only identity and UX metadata
// (backendUser) cross between Auth.js and the app.
declare module "next-auth" {
  interface Session {
    backendUser?: AuthUser;
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    backendUser?: AuthUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    backendUser?: AuthUser;
  }
}
