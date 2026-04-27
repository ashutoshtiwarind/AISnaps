# SnapCoach Architecture Guide

## 🏗️ New Project Structure

```
SnapCoach/
│
├── src/
│   ├── app/
│   │   └── index.tsx                 # Main camera screen (650 lines, clean & focused)
│   │
│   ├── components/                   # Reusable UI Components
│   │   ├── overlays/
│   │   │   └── GridOverlay.tsx       # 9 composition guide overlay modes
│   │   ├── gallery/
│   │   │   ├── VideoThumbnailThumb.tsx  # Video thumbnail generation
│   │   │   └── VideoItem.tsx            # Video playback component
│   │   └── index.ts                  # Centralized exports
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── useAICoach.ts            # AI scoring and composition tips (existing)
│   │   ├── useMediaLibrary.ts       # Media library permission management
│   │   └── index.ts                 # Centralized exports
│   │
│   ├── services/                     # Business Logic & External APIs
│   │   ├── mediaLibrary.ts          # All media library operations
│   │   ├── overlayCalculations.ts   # Pure geometry calculation functions
│   │   └── index.ts                 # Centralized exports
│   │
│   ├── constants/                    # Static Configuration
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
