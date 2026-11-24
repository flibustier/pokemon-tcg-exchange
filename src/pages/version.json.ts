import type { APIRoute } from 'astro'

// Which build is online, see astro.config.ts
export const GET: APIRoute = () => Response.json({ build: __BUILD_ID__ })
