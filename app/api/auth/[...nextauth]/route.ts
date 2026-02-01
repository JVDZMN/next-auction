import NextAuth, { SessionStrategy } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { Role, User } from '@prisma/client'
import bcrypt from 'bcrypt'

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
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

        // Only select fields needed for session
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            password: true, // needed for password check only
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

        // Return sanitized user object (exclude password)
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }: { token: any; user?: any; account?: any; profile?: any }) {
      // Set user id for both credentials and OAuth logins
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        if ((user as User).role) token.role = (user as User).role;
      }
      // Hydrate role if missing and email present (for OAuth logins)
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          if (!token.id) token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
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
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
