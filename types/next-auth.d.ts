import { DefaultSession, DefaultUser } from 'next-auth'
import { Role, UserType } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      mitIdVerified: boolean
      userType: UserType
      isApprovedByAdmin: boolean
    } & DefaultSession['user']
  }
  interface User extends DefaultUser {
    id: string
    role: Role
    mitIdVerified?: boolean
    userType?: UserType
    isApprovedByAdmin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    mitIdVerified?: boolean
    userType?: UserType
    isApprovedByAdmin?: boolean
  }
}
