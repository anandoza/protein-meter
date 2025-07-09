# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

**Development:**

- `npm run dev` - Start Vite development server
- `npm run build` - TypeScript compile + Vite production build
- `npm run preview` - Preview production build locally

**Testing:**

- `npm test` - Run Vitest in watch mode
- `npm test -- --run` - Run tests once (for CI)
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Generate test coverage report

**Code Quality:**

- `npm run typecheck` - TypeScript type checking without emit
- `npm run lint` - ESLint with zero warnings policy
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is properly formatted

**Local CI:**

- `npm run ci` - Run all CI checks locally (typecheck, lint, format check, tests, build)

## Architecture Overview

### Core Pattern: Event-Driven Class Components

The application uses **class-based components** communicating through a **centralized EventBus singleton**:

```typescript
// Component communication pattern
EventBus.getInstance().emit<EventType>(EVENTS.EVENT_NAME, data)
EventBus.getInstance().on<EventType>(EVENTS.EVENT_NAME, handler)
```

**Main App Structure:**

- `ProteinMeterApp` (main.ts) - Central orchestrator that instantiates and coordinates all components
- Components are classes with `show()`, `hide()`, and lifecycle methods
- Services are static utility classes for API, calculations, and storage

### Component Architecture

**Location Pattern:** `src/components/[ComponentName]/[ComponentName].ts`

Each component follows this pattern:

- Constructor takes DOM container element
- Event handlers registered in constructor
- `show()/hide()` methods for UI state management
- Private methods for internal logic

**Service Layer:** `src/services/`

- `api/openFoodFactsAPI.ts` - External API calls with timeout handling
- `calculator/proteinCalculator.ts` - Protein percentage calculations and color coding
- `storage/historyStorage.ts` - LocalStorage operations with error handling

### Type System Structure

**Core Types:** `src/types/`

- `product.ts` - OpenFoodFacts API and display data interfaces
- `history.ts` - History item and operations interfaces
- `ui.ts` - UI modes, form data, and event interfaces

**Import Pattern:** Use `@/types` alias for clean imports

### Testing Patterns

**Test Setup:** Vitest + Happy-DOM + comprehensive mocking

- Each component has corresponding `.test.ts` file
- Mock external dependencies (html5-qrcode, DOM elements)
- Test both success and error scenarios
- Event emission and handling verification

**Running Single Test:**

```bash
npm test -- ComponentName.test.ts
```

### PWA Implementation

**Dual Service Worker Setup:**

1. Custom service worker (`service-worker.js`) - App shell caching
2. Vite PWA plugin - API caching with Workbox strategies

**Caching Strategy:**

- App shell: Cache-first
- API calls: Network-first with fallback
- External assets: Cache-first with expiration

### Key Architectural Decisions

1. **No Framework Dependency** - Pure TypeScript with minimal external dependencies
2. **Event-Driven Communication** - Loose coupling between components via EventBus
3. **Class-Based Components** - Object-oriented approach with clear lifecycle management
4. **Comprehensive Error Handling** - All API calls and user interactions have error states
5. **Type-Safe Everything** - Strong TypeScript usage throughout, including event interfaces

### Development Notes

- Uses Tailwind CSS via CDN for styling
- Path aliases configured: `@/` maps to `src/`
- ESLint configured with zero warnings policy
- Prettier formatting enforced
- Node.js 22 specified in `.nvmrc`
- All tests must pass before merging (GitHub Actions CI)

### Styling Architecture

**CSS Organization:** `src/styles/main.css`

- All custom styles live in `main.css` - no inline styles in HTML
- Tailwind CSS loaded via CDN in `index.html`
- Component-specific styles grouped with comments
- Uses PostCSS with Tailwind directives (@tailwind base/components/utilities)
- Button icons use CSS filter for consistent white color in production builds

### Component Interaction Flow

1. User action triggers event via component
2. EventBus broadcasts typed event
3. Other components listen and respond
4. Services handle business logic
5. UI updates reflect state changes

This architecture enables adding new features by creating new components that plug into the existing event system without modifying existing code.
