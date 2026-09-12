import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/legal/'],
      disallow: [
        '/api/',
        '/takvim/',
        '/hasta-listesi/',
        '/stok-yonetimi/',
        '/ayarlar/',
        '/admin/',
        '/odeme/',
      ],
    },
    sitemap: 'https://dermofis.com/sitemap.xml',
  }
}
