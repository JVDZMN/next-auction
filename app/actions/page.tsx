import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { approveBusinessUser } from '@/app/actions/admin-users'

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await requireAdmin()

  if (!session) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/users`)
  }

  // Fetch pending business users
  const pendingUsers = await prisma.user.findMany({
    where: {
      role: 'BUSINESS_USER',
      isApprovedByAdmin: false,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Pending Business Accounts</h1>
      
      {pendingUsers.length === 0 ? (
        <p className="text-gray-600">No pending business accounts to approve.</p>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <div key={user.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-white shadow-sm">
              <div>
                <p className="font-semibold">{user.name || 'No Name Provided'}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">CVR Number: <span className="font-mono bg-gray-100 px-1 rounded">{user.cvrNumber || 'N/A'}</span></p>
              </div>
              <form action={async () => {
                "use server"
                await approveBusinessUser(user.id)
              }}>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors">
                  Approve Account
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}