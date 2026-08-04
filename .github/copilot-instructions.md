# Next.js TypeScript Boilerplate - AI Coding Guide

## Architecture Overview

This is a feature-based Next.js 15 application using:

- **Redux Toolkit + RTK Query**: API calls with auto-generated hooks
- **Socket.io**: Real-time communication with namespace-based architecture
- **i18next**: Multi-language support (en/id/cn) with unified JSON structure
- **React Hook Form + Zod**: Form validation
- **Tailwind CSS**: All styling via [components/theme.ts](components/theme.ts) variant system

## Critical Patterns

### Store Feature Structure (RTK Query)

**Helper-based API definitions** via [store/shared/apiHelpers.ts](store/shared/apiHelpers.ts):

```typescript
// ✅ Use mutation() and query() helpers - they auto-wrap builders
const login = mutation<LoginRequest, AuthResponse>('/public/auth/login', {
  invalidatesTags: ['Auth'],
})

// ❌ Don't manually write builder.mutation - helpers handle useCallback patterns
```

Standard endpoints: mutations POST/PUT/DELETE, queries use GET. All responses follow `{ data, message }` format.

### Socket Feature Pattern

**Feature-based sockets** using `createEmitter()` and `createListener()` helpers from [sockets/socketHelpers.ts](sockets/socketHelpers.ts):

```typescript
// Each feature file contains: schemas, types (inferred), emit/listen helpers
const sendMessage = createEmitter(emit, 'emitSendMessage', schema) // auto-validates + useCallback
const onMessage = createListener<OnMessage>(on, off, 'onMessage') // auto-useCallback
```

**Naming convention enforced by TypeScript**:

- Client→Server: `emit*` prefix (e.g., `emitJoinRoom`)
- Server→Client: `on*` prefix (e.g., `onRoomJoined`)

Namespaces combine features in `index.ts` (see [sockets/default/index.ts](sockets/default/index.ts)). Switch namespaces via `SocketContext.switchNamespace()`.

### Translation System

**Unified JSON structure** in [translations/locales/](translations/locales/):

```json
{
  "welcome": { "en": "Welcome", "id": "Selamat Datang", "cn": "欢迎" }
}
```

Usage: `const { t } = useTranslation('namespace')` then `t('key')`. Language stored in cookies, switched via `LanguageSelect` component.

### Component Variants

**All styling via theme system** ([components/theme.ts](components/theme.ts)):

```tsx
// ✅ Use typed variants
<Button variant="primary" size="md">
  Save
</Button>

// ❌ Don't add custom Tailwind classes to base components - extend in theme.ts
```

Variants defined in [components/theme.ts](components/theme.ts), implementations return Tailwind strings.

### Form Validation

**React Hook Form + Zod with controlled components** in [components/base/controlled/](components/base/controlled/):

```tsx
<ControlledInput name="email" control={control} errors={errors} />
// Components auto-integrate with RHF - no manual onChange needed
```

### Middleware & Error Handling

**RTK Query middleware** ([store/middleware/rtkQueryMiddleware.ts](store/middleware/rtkQueryMiddleware.ts)) auto-shows toasts for all API errors. Uses `setToastCallback()` initialized in [pages/\_app.tsx](pages/_app.tsx).

Standard error codes from `ErrorCodes` enum - includes rate limiting, validation, etc.

## Development Workflows

### CLI Generators (Use These!)

```bash
# Generate Redux feature with API + slice + schemas
pnpm run create-store products

# Generate translation namespace
pnpm run create-translation dashboard

# Generate socket namespace/features
pnpm run create-socket-namespace notifications
pnpm run create-socket-feature notifications alert

# Validate all translations complete
pnpm run validate-translation
```

**Auto-registration**: Scripts update [store/store.ts](store/store.ts), [translations/i18n.ts](translations/i18n.ts), and socket index files automatically.

### Route Protection

**ProtectRoute component** ([components/ProtectRoute.tsx](components/ProtectRoute.tsx)) wraps all pages in [pages/\_app.tsx](pages/_app.tsx).

Public paths in `PublicPaths` array. Protected routes auto-redirect to `/login?redirected_from=...` if unauthenticated.

### Auth Flow

1. Login mutation → stores auth in Redux `authSlice`
2. `getUserQuery` provides user data (auto-refetches on `['Auth', 'User']` invalidation)
3. Layouts check `state.auth.authenticated` from Redux

## Key Conventions

- **Path aliases**: `~/` maps to project root (see [tsconfig.json](tsconfig.json))
- **File naming**: kebab-case for files, PascalCase for components, camelCase for utilities
- **Package manager**: PNPM only (`packageManager` in [package.json](package.json))
- **Import order**: React, Next.js, external libs, internal `~/` imports
- **Component props**: TypeScript interfaces prefixed with `I` (e.g., `IButton`)

## Integration Points

- **NProgress**: Route changes show top loading bar (configured in [pages/\_app.tsx](pages/_app.tsx))
- **Luxon**: Date handling with `defaultLocale` set to `'en-EN'`
- **Analytics**: `TrackingProvider` in [contexts/TrackingContext.tsx](contexts/TrackingContext.tsx) wraps app - supports GA4/FB/TikTok/LinkedIn
- **Layouts**: Three layouts in [layouts/](layouts/) - `Internal` (authenticated), `Default` (public), `Centered` (auth pages)

## Common Gotchas

1. **Socket events must follow emit*/on* naming** or TypeScript will error
2. **Translations need all 3 languages** (en/id/cn) - run `pnpm run validate-translation` before committing
3. **API mutations auto-invalidate tags** - don't manually refetch unless needed
4. **Don't bypass theme.ts** - extend variants there instead of adding inline Tailwind
5. **Controlled components require `control` prop** from `useForm()` - don't use uncontrolled inputs

## File References

- API patterns: [store/features/auth/authApi.ts](store/features/auth/authApi.ts)
- Socket example: [sockets/default/echo.ts](sockets/default/echo.ts)
- Component example: [components/base/Button.tsx](components/base/Button.tsx)
- Layout example: [layouts/Internal.tsx](layouts/Internal.tsx)
