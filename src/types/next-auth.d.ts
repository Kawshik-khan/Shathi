import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
import type { AuthUser } from "@/types";

declare module "next-auth" {
  interface Session {
    backendToken?: string;
    backendRefreshToken?: string;
    backendExpiresIn?: number;
    backendUser?: AuthUser;
    user: {
      id: string;
      backendToken?: string;
    } & DefaultSession["user"];
  }

  interface User {
    backendToken?: string;
    backendRefreshToken?: string;
    backendExpiresIn?: number;
    backendUser?: AuthUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    backendToken?: string;
    backendRefreshToken?: string;
    backendExpiresIn?: number;
    backendUser?: AuthUser;
  }
}
