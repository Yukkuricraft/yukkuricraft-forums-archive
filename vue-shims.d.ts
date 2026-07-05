// Ambient declaration for `*.vue` single-file components.
//
// vue-tsc resolves `.vue` imports through its own virtual modules and ignores
// this shim, so full type checking is unaffected. Plain `tsc`, used by eslint
// for type-aware linting, has no built-in `.vue` module type, and without
// this shim every `.vue` import resolves to an error type.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
