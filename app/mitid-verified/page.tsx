import Link from 'next/link'

const errors: Record<string, string> = {
  missing: 'The verification request was incomplete.',
  invalid_state: 'The verification link is invalid or expired.',
  token_failed: 'MitID could not confirm your identity. Please try again.',
}

export default function MitIdVerifiedPage({
  searchParams,
}: {
  searchParams: { status?: string; reason?: string }
}) {
  const success = searchParams.status === 'success'
  const message = success
    ? 'Your identity has been verified with MitID.'
    : (errors[searchParams.reason ?? ''] ?? 'Something went wrong. Please try again.')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">{success ? '🇩🇰' : '❌'}</div>
        <h1 className={`text-2xl font-bold mb-2 ${success ? 'text-green-700' : 'text-red-700'}`}>
          {success ? 'MitID Verified' : 'Verification Failed'}
        </h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}
