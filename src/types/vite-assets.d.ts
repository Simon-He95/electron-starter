// Vite asset types for imports with queries
declare module '*?asset' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.png?asset' {
  const src: string
  export default src
}
