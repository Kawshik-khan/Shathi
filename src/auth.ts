import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiFetch } from "@/lib/api";
import { exchangeGoogleTokenForBackendTokens } from "@/lib/server/backend-auth";
import { AuthUser, TokenResponse } from "@/types";

type BackendAuthUser = {
  backendToken?: string;
  backendRefreshToken?: string;
  backendExpiresIn?: number;
  backendUser?: AuthUser;
};

function getAuthSecret(): string | string[] {
  const primarySecret = process.env.AUTH_SECRET;
  const fallbackSecret = process.env.NEXTAUTH_SECRET;
  const isStrictProduction = process.env.VERCEL_ENV === "production";
  const rotationSecrets = [
    process.env.AUTH_SECRET_1,
    process.env.AUTH_SECRET_2,
    process.env.AUTH_SECRET_3,
  ].filter((secret): secret is string => Boolean(secret));

  if (isStrictProduction) {
    if (!primarySecret || primarySecret === "generate_secure_random_string") {
      throw new Error("AUTH_SECRET must be set to a stable random value in Vercel production.");
    }

    return [primarySecret, ...rotationSecrets];
  }

  return primarySecret ?? fallbackSecret ?? "development-auth-secret";
}

const config = {
  secret: getAuthSecret(),
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const tokens = await apiFetch<TokenResponse>("/api/v1/auth/login", {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!tokens?.user) {
            return null;
          }

          return {
            id: tokens.user.id,
            email: tokens.user.email,
            name: tokens.user.name,
            image: tokens.user.avatar_url,
            backendToken: tokens.access_token,
            backendRefreshToken: tokens.refresh_token,
            backendExpiresIn: tokens.expires_in,
            backendUser: tokens.user,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.backendToken = (user as BackendAuthUser).backendToken;
        token.backendRefreshToken = (user as BackendAuthUser).backendRefreshToken;
        token.backendExpiresIn = (user as BackendAuthUser).backendExpiresIn;
        token.backendUser = (user as BackendAuthUser).backendUser;
      }

      if (account?.provider === "google" && account.id_token) {
        const response = await exchangeGoogleTokenForBackendTokens({
          googleToken: account.id_token,
          profile: {
            email: user?.email,
            name: user?.name,
            image: user?.image,
          },
        });

        if (response.user) {
          token.id = response.user.id;
          token.email = response.user.email;
          token.name = response.user.name;
          token.picture = response.user.avatar_url;
          token.backendToken = response.access_token;
          token.backendRefreshToken = response.refresh_token;
          token.backendExpiresIn = response.expires_in;
          token.backendUser = response.user;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.backendToken = token.backendToken as string;
      }
      session.backendToken = token.backendToken;
      session.backendRefreshToken = token.backendRefreshToken;
      session.backendExpiresIn = token.backendExpiresIn;
      session.backendUser = token.backendUser;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
