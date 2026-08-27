import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { ensureSchema } from "./schema-heal";

const secret = process.env.NEXTAUTH_SECRET || "sappy-fallback-dev-secret-change-in-prod-abc123xyz";

export const authOptions: NextAuthOptions = {
  secret,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        masterCode: { label: "Master code (for new sign-ups)", type: "password" },
      },
      async authorize(credentials) {
        await ensureSchema(prisma);
        if (!credentials?.email || !credentials?.password) return null;

        let user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } });

        // SIGN-UP path: user doesn't exist → require master code
        if (!user) {
          const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
          if (!settings) return null;
          const ok = await bcrypt.compare(credentials.masterCode || "", settings.masterHash);
          if (!ok) return null;

          const hash = await bcrypt.hash(credentials.password, 10);
          user = await prisma.user.create({
            data: {
              email: credentials.email.toLowerCase(),
              name: String(credentials.name || credentials.email.split("@")[0]).slice(0, 60),
              passwordHash: hash,
              role: "staff",
            },
          });
          await prisma.activity.create({
            data: { action: "account_created", details: credentials.email, userId: user.id },
          });
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};