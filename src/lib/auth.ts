import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin / fitter" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Hardcoded for demo/local testing. Can be moved to DB later.
        if (credentials?.username === "admin" && credentials?.password === "Mitali") {
          return { id: "1", name: "Admin User", role: "ADMIN" } as any;
        }
        if (credentials?.username === "fitter" && credentials?.password === "fitter") {
          return { id: "2", name: "Fitter Team A", role: "FITTER" } as any;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret",
};
