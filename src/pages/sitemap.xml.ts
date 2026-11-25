import type { APIRoute } from 'astro'

import { defaultOf, publicPages } from '@/site/pages'

// The public pages and their languages, for search engines
export const GET: APIRoute = ({ site }) => {
  const absolute = (address: string) => new URL(address, site).href
  const link = (language: string, address: string) =>
    `    <xhtml:link rel="alternate" hreflang="${language}" href="${absolute(address)}"/>`

  const urls = publicPages.map((page) => {
    const english = defaultOf(page)
    return [
      '  <url>',
      `    <loc>${absolute(page.address)}</loc>`,
      ...page.alternates.map(({ locale, address }) => link(locale, address)),
      ...(english ? [link('x-default', english)] : []),
      '  </url>',
    ].join('\n')
  })

  return new Response(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
      ...urls,
      '</urlset>',
      '',
    ].join('\n'),
    { headers: { 'content-type': 'application/xml' } },
  )
}
