/**
 * Returns a Prisma `where` fragment that restricts cars to those owned
 * by users of the given type.  Used in every cars query to enforce the
 * PRIVATE / BUSINESS market separation.
 *
 * Pass `undefined` when the caller has no session (unauthenticated browsing
 * shows all cars).
 */
export function getUserTypeFilter(userType: 'PRIVATE' | 'BUSINESS' | undefined) {
  if (!userType) return {}
  return { owner: { userType } } as const
}
