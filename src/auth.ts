import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiFetch } from "@/lib/api";
import { TokenResponse, AuthUser } from "@/types";

const config = {
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
          };
        } catch (error) {
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
        token.backendToken = (user as any).backendToken;
      }

      // Handle Google OAuth
      if (account?.provider === "google") {
        try {
          // Exchange Google token for backend token
          const response = await apiFetch<TokenResponse>(
            "/api/v1/auth/google-callback",
            {
              method: "POST",
              body: JSON.stringify({
                googleToken: account.id_token,
                profile: {
                  email: user?.email,
                  name: user?.name,
                  image: user?.image,
                },
              }),
            }
          );

          if (response?.user) {
            token.id = response.user.id;
            token.backendToken = response.access_token;
          }
        } catch (error) {
          console.error("Google callback error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.backendToken = token.backendToken as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        // Credentials provider already handled by authorize callback
      }
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
