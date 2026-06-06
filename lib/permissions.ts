export type Permission =
  | 'canViewPrivateCars'
  | 'canViewBusinessCars'
  | 'canBidOnPrivateCars'
  | 'canBidOnBusinessCars'
  | 'canListPrivateCar'
  | 'canListBusinessCar'
  | 'canHaveDealerProfile'
  | 'canViewDealers'
  | 'canApproveBusinessUsers'
  | 'canDeleteListings'
  | 'canBanUsers'
  | 'canViewAllCars'

const rolePermissions: Record<string, Permission[]> = {
  PRIVATE_USER: [
    'canViewPrivateCars',
    'canBidOnPrivateCars',
    'canListPrivateCar',
  ],
  BUSINESS_USER: [
    'canViewBusinessCars',
    'canBidOnBusinessCars',
    'canListBusinessCar',
    'canHaveDealerProfile',
    'canViewDealers',
  ],
  ADMIN: [
    'canViewPrivateCars',
    'canViewBusinessCars',
    'canBidOnPrivateCars',
    'canBidOnBusinessCars',
    'canListPrivateCar',
    'canListBusinessCar',
    'canHaveDealerProfile',
    'canViewDealers',
    'canApproveBusinessUsers',
    'canDeleteListings',
    'canBanUsers',
    'canViewAllCars',
  ],
}

export function hasPermission(
  role: string | undefined,
  permission: Permission,
  isApprovedByAdmin?: boolean
): boolean {
  if (!role) return false
  if (
    role === 'BUSINESS_USER' &&
    !isApprovedByAdmin &&
    permission !== 'canViewBusinessCars' &&
    permission !== 'canViewDealers'
  ) {
    return false
  }
  return rolePermissions[role]?.includes(permission) ?? false
}

export function getCarFilter(role: string | undefined) {
  if (role === 'PRIVATE_USER') {
    return { owner: { role: 'PRIVATE_USER' as const } }
  }
  if (role === 'BUSINESS_USER') {
    return { owner: { role: 'BUSINESS_USER' as const } }
  }
  if (role === 'ADMIN') {
    return {}
  }
  // Guest: show private cars by default
  return { owner: { role: 'PRIVATE_USER' as const } }
}
