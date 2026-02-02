/**
 * Centralized API configuration.
 *
 * All components should import API_BASE_URL from here
 * instead of defining it locally.
 *
 * IMPORTANT: NEXT_PUBLIC_API_URL must be set in all environments.
 * No hardcoded production URL to prevent accidental prod hits from dev/staging.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Validate that API_BASE_URL is configured in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('[api-config] NEXT_PUBLIC_API_URL is not set. Using localhost fallback.')
  }
}
