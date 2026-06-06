import { DefaultSession, DefaultUser } from 'next-auth'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'PRIVATE_USER' | 'BUSINESS_USER' | 'ADMIN'
      mitIdVerified: boolean
      isApprovedByAdmin: boolean
    } & DefaultSession['user']
  }
  interface User extends DefaultUser {
    id: string
    role: Role
    mitIdVerified?: boolean
    isApprovedByAdmin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    mitIdVerified?: boolean
    isApprovedByAdmin?: boolean
  }
}
