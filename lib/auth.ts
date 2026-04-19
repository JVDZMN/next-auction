import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { SessionStrategy } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session, User } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import { getServerSession } from 'next-auth';

export const authOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const genericError = new Error('Invalid email or password');
        if (!credentials?.email || !credentials?.password) {
          throw genericError;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            password: true,
            emailVerified: true,
          },
        });
        if (!user || !user.password) {
          throw genericError;
        }
        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isCorrectPassword) {
          throw genericError;
        }
        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in. Check your inbox.');
        }
        const { password, ...rest } = user;
        const { emailVerified: _, ...sanitizedUser } = rest;
        void _;
        return sanitizedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        if ((user).role) token.role = (user).role;
      }
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          if (!token.id) token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.picture as string) || (token.image as string) || null;
        session.user.role =
          typeof token.role === 'string' && Object.values(Role).includes(token.role as Role)
            ? (token.role as Role)
            : Role.User;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return session
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!user || user.role !== Role.Admin) return null
  return session
}
