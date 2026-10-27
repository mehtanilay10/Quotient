import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMAIL_FROM, MAGIC_LINK_EXPIRY_SECONDS, sendMagicLinkEmail } from "@/lib/magicLink";

const trustHost =
  Boolean(process.env.AUTH_TRUST_HOST) ||
  Boolean(process.env.AUTH_URL) ||
  Boolean(process.env.VERCEL) ||
  Boolean(process.env.CF_PAGES) ||
  process.env.NODE_ENV !== "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid profile email",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    // Passwordless email sign-in ("magic link"). The Resend provider sends the
    // link through Resend's HTTP API, so no SMTP/nodemailer dependency is
    // needed. Its `id` is overridden to "email" so the public API stays
    // `signIn("email")` and the callback lives at /api/auth/callback/email.
    Resend({
      id: "email",
      name: "Email",
      from: process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM,
      apiKey: process.env.RESEND_API_KEY,
      // Auth.js expects `maxAge` in seconds. Keep it in sync with the
      // "expires in N minutes" copy shown in the email and UI.
      maxAge: MAGIC_LINK_EXPIRY_SECONDS,
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLinkEmail({ to: identifier, url });
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify-request",
    error: "/login/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
