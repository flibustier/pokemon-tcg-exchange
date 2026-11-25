/// <reference types="astro/client" />

// The time of the build, written by astro.config.ts
declare const __BUILD_ID__: string

// The card names of a language, by English name or by card id, written by build/plugins.ts
declare module 'virtual:card-names/*' {
  const names: Record<string, string>
  export default names
}
