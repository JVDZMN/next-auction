import { getCarFilter } from './permissions'

export { getCarFilter }

/** @deprecated Use getCarFilter from lib/permissions */
export function getUserTypeFilter(role: string | undefined) {
  return getCarFilter(role)
}
