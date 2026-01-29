/**
 * Centralized API configuration.
 *
 * All components should import API_BASE_URL from here
 * instead of defining it locally.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://rijksuitgaven-api-production-3448.up.railway.app'
