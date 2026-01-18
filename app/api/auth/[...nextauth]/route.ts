import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { Session } from "next-auth";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
            });
                if (!user || !user.password) return null;
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;
                return user;
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
  ],
  callbacks: {
  async session({ session, token }: { session: Session; token: any }) {
    const email = session.user?.email ?? token?.email;
    if (!email) return session;
    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    if (dbUser) {
      session.user.role = dbUser.role;
    }
    return session;
  },
},
  // ...other options (adapter, secret, etc.)...
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };