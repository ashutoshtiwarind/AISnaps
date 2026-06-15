# AISnaps Architecture Guide

## Current Project Structure

```
AISnaps/
├── app/
│   └── index.tsx               # Main camera screen and primary app flow
├── components/                 # Reusable UI components
├── constants/                  # Shared static configuration
├── hooks/                      # Custom hooks and state logic
├── assets/                     # Static media and assets
├── package.json                # Dependencies and scripts
├── README.md                   # Project overview and run instructions
├── ARCHITECTURE.md             # Architecture summary and current state
├── CODE_QUALITY_CHECKLIST.md   # Coding and review checklist
└── ...
```

## What exists today

- **Single-entry app screen:** `app/index.tsx` hosts the main experience, including camera flow, overlay controls, AI coach, and gallery modal.
- **Reusable modules:** `components/`, `constants/`, and `hooks/` provide supporting pieces.
- **Web demo mode:** The web build renders a mock camera preview and maintains UI controls without native camera access.
- **Native camera integration:** `react-native-vision-camera` is used for Android/iOS, while web uses fallback behavior.

## Key architectural patterns

### Screen-first UI
- The app is centered on one main screen rather than multi-screen navigation.
- This supports fast iteration on the core camera experience.

### Shared state, platform-specific rendering
- Core UI state is initialized once, then platform path decides whether to render native camera or web fallback.
- This keeps overlay and control behavior consistent across platforms.

### Overlay rendering as reusable logic
- Composition guides are rendered using SVG and can be reused on both mobile and web.
- This is the most platform-agnostic part of the codebase.

## Current architecture concerns

### 1. Main screen size
- `app/index.tsx` is still large and mixes UI, camera hooks, gallery, and state.
- Priority: split the screen into smaller components and hooks.

### 2. Web/native separation
- Web demo mode currently lives inside the same file as native camera logic.
- Priority: move web fallback into a cleaner platform-specific path or dedicated component.

### 3. Dependency mismatch
- Package warnings indicate Expo dependencies should be aligned to expected versions.
- Priority: upgrade and validate package compatibility.

### 4. Mobile feature validation
- Real mobile capture, recording, and permission flow are not fully verified.
- Priority: test actual devices and fix native camera issues.

## Recommended next steps

1. **Refactor `app/index.tsx`** into reusable components.
2. **Separate web/demo mode** from native camera logic.
3. **Validate mobile capture** on device/emulator.
4. **Upgrade Expo dependencies** to expected versions.
5. **Add error states** for camera, mic, and media library permissions.
6. **Document current architecture** and update run instructions.

│   │   └── index.ts                 # Overlay options, colors, math constants
│   │
│   ├── types/                        # TypeScript Definitions
│   │   └── index.ts                 # All type definitions and interfaces
│   │
│   ├── lib/                          # Utility Functions
│   │   ├── helpers.ts               # String formatting, math, debounce
│   │   └── index.ts                 # Centralized exports
│   │
│   └── styles/                       # Centralized StyleSheets
│       └── index.ts                 # All style definitions (300+ lines)
│
├── CONTRIBUTING.md                   # Developer Guide (NEW)
├── REFACTORING.md                    # Refactoring Summary (NEW)
└── ... (existing files)
```

## 📊 Refactoring Results

### Before
- **Single File**: 1,059 lines (`app/index.tsx`)
- **Mixed Concerns**: UI, logic, styles, calculations all together
- **Hard to Extend**: Changes affect entire file
- **Difficult to Test**: No clear business logic boundaries
- **Code Reuse**: Low - everything tied to component

### After
- **Organized Structure**: 9 focused modules
- **Separation of Concerns**: Each module has one responsibility
- **Easy to Extend**: Add features without touching unrelated code
- **Testable**: Pure functions and isolated services
- **Reusable Code**: Components, hooks, utilities easily reused

## 🎯 Module Purposes

### `components/`
**Reusable UI Components**
- Pure React components
- Minimal business logic
- Clear props interface
- Example: `GridOverlay` (9 different overlay modes)

### `services/`
**Business Logic & External APIs**
- Pure calculation functions
- Media library operations
- No React dependencies
- Example: Geometric calculations for overlays

### `hooks/`
**Stateful React Logic**
- Custom hooks
- State and side effects
- Reusable across components
- Example: `useAICoach`, `useMediaLibrary`

### `constants/`
**Static Configuration**
- All magic numbers
- Static arrays and objects
- Color definitions
- Example: `OVERLAY_OPTIONS`, `FLASH_ICONS`

### `types/`
**TypeScript Definitions**
- All interfaces
- Type aliases
- Clear data structures
- Example: `OverlayMode`, `MediaItem`, `FlashMode`

### `lib/`
**Utility Functions**
- Pure functions
- No side effects
- Reusable everywhere
- Example: `pad()`, `formatDuration()`, `clamp()`

### `styles/`
**Centralized StyleSheets**
- All styling organized
- Easy to theme
- Consistent naming
- Example: `screenStyles`, `overlayStyles`

## 🔄 Data Flow

```
User Interaction
       ↓
   Components (UI)
       ↓
    Hooks (State)
       ↓
Services (Logic)
       ↓
    Lib (Utils)
       ↓
 Constants (Config)
       ↓
    Types (Safety)
```

## 📝 Development Workflow

### Adding a New Feature

1. **Define Types** → `src/types/index.ts`
2. **Add Constants** → `src/constants/index.ts`
3. **Create Service** → `src/services/featureName.ts` (if needed)
4. **Build Component** → `src/components/featureName.tsx`
5. **Add Hook** → `src/hooks/useFeature.ts` (if stateful)
6. **Integrate** → Import and use in screens

### Modifying Existing Feature

1. Find the relevant module (type, constant, service, etc.)
2. Make isolated change
3. Changes propagate automatically
4. No unrelated code affected

## 🚀 Benefits for Development

### For New Developers
- Clear structure is easy to understand
- CONTRIBUTING.md provides detailed guidance
- Related code grouped logically
- Easy to find where things belong

### For Existing Developers
- Changes are isolated
- Less merge conflicts
- Easier code reviews
- Faster debugging

### For Maintenance
- Types ensure correctness
- Constants centralized
- Services are pure/testable
- Styles consistent

## 📚 Key Files to Know

| File | Purpose | When to Edit |
|------|---------|--------------|
| `src/types/index.ts` | Type definitions | Adding new concepts |
| `src/constants/index.ts` | Configuration | Magic numbers, options |
| `src/app/index.tsx` | Main screen | App-level logic |
| `src/services/` | Business logic | Core functionality |
| `src/components/` | UI components | Visual updates |
| `src/styles/index.ts` | Styling | Design changes |
| `CONTRIBUTING.md` | Guidelines | Learning structure |

## 🔍 File Discovery Pattern

```
Need to change something?

Is it a type/interface? → src/types/
Is it a number/constant? → src/constants/
Is it a UI component? → src/components/
Is it styling? → src/styles/
Is it business logic? → src/services/
Is it a utility? → src/lib/
Is it state/hooks? → src/hooks/
Is it a screen? → src/app/
```

## Current project tracking

- Use `memory.md` to capture implementation status, ongoing decisions, and pending tasks.
- Keep web/native constraints documented to avoid importing native-only modules on web.

## ✅ Quality Improvements

- **Type Safety**: Comprehensive TypeScript
- **Code Organization**: Logical separation
- **Documentation**: JSDoc on all exports
- **Testability**: Pure functions, clear boundaries
- **Maintainability**: Easy to understand and modify
- **Scalability**: Easy to add new features
- **Reusability**: Components and utilities available everywhere

## 🎓 Learning Resources

- **CONTRIBUTING.md** - Comprehensive development guide
- **REFACTORING.md** - Detailed refactoring summary
- Code comments - JSDoc on all public APIs
- File organization - Self-documenting structure

---

**Start here**: Read CONTRIBUTING.md for detailed guidelines on contributing to the project!
