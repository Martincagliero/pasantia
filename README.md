# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Dominio visible en el acceso con Google

Google muestra el dominio del callback OAuth. Para que no aparezca el identificador
`dayuizjuobfpzytyqcgs.supabase.co`, hay que activar un dominio personalizado de
Supabase, por ejemplo `auth.pasantia.com`.

1. En el DNS, crear un CNAME de `auth.pasantia.com` hacia
  `dayuizjuobfpzytyqcgs.supabase.co`.
2. En Supabase, abrir **Project Settings > General > Custom Domains**, verificar el
  dominio y activarlo.
3. Antes de activarlo, agregar en Google Auth Platform > Clients > Authorized
  redirect URIs:
  `https://auth.pasantia.com/auth/v1/callback`.
4. Conservar también durante la transición:
  `https://dayuizjuobfpzytyqcgs.supabase.co/auth/v1/callback`.
5. En Vercel, agregar para Production, Preview y Development:
  `VITE_SUPABASE_CUSTOM_URL=https://auth.pasantia.com` y volver a desplegar.
6. En Google Auth Platform > Branding, configurar PasantIA, logo, dominio, política
  de privacidad y términos; después solicitar la verificación de marca.

El cliente prioriza `VITE_SUPABASE_CUSTOM_URL` y usa `VITE_SUPABASE_URL` como
respaldo. Cambiar solamente el `redirectTo` de la aplicación no modifica el dominio
que Google enseña, porque ese valor corresponde al regreso desde Supabase hacia la
web, no al callback entre Google y Supabase.
