import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/team/', '/profiel', '/s/'],
      },
    ],
    sitemap: 'https://rijksuitgaven.nl/sitemap.xml',
  }
}
