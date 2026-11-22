import { ROOT_DOMAIN } from './env'

export function subdomainUrl(slug: string): string {
  return `https://${slug}.${ROOT_DOMAIN}`
}

/** Path-based storefront URL on the platform host; works without wildcard DNS. */
export function pathStoreUrl(slug: string): string {
  return `${window.location.origin}/s/${slug}`
}
