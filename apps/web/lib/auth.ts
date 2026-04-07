import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { authSchema, getDb, isDatabaseConfigured } from "@instagram-insights/db";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { getEnv } from "@/lib/env";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
    };
  }
}

const googleClientId = getEnv("AUTH_GOOGLE_ID") ?? getEnv("GOOGLE_CLIENT_ID");
const googleClientSecret =
  getEnv("AUTH_GOOGLE_SECRET") ?? getEnv("GOOGLE_CLIENT_SECRET");

export const isGoogleAuthConfigured = Boolean(
  googleClientId && googleClientSecret,
);

export const authOptions: NextAuthOptions = {
  adapter: isDatabaseConfigured ? DrizzleAdapter(getDb(), authSchema) : undefined,
  secret:
    getEnv("AUTH_SECRET") ??
    getEnv("NEXTAUTH_SECRET") ??
    getEnv("INSTAGRAM_APP_SECRET"),
  session: {
    strategy: isDatabaseConfigured ? "database" : "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: isGoogleAuthConfigured
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        }),
      ]
    : [],
  callbacks: {
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = user?.id ?? token.sub;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
