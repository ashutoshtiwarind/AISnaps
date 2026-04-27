# Contributing to SnapCoach

Welcome to SnapCoach! This guide will help you understand the codebase structure and how to contribute effectively.

## Project Overview

SnapCoach is a React Native/Expo-based camera application that provides AI-powered composition guidance, overlay grids, and media management features.

## Directory Structure

```
SnapCoach/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── overlays/       # Composition guide overlays
│   │   │   └── GridOverlay.tsx
│   │   ├── gallery/        # Gallery and media components
│   │   │   ├── VideoItem.tsx
│   │   │   └── VideoThumbnailThumb.tsx
│   │   └── [other components]
│   ├── hooks/              # Custom React hooks
│   │   ├── useAICoach.ts  # AI scoring and tips
│   │   └── [other hooks]
│   ├── services/           # Business logic and external APIs
│   │   ├── mediaLibrary.ts
│   │   └── overlayCalculations.ts
│   ├── constants/          # Static configuration values
│   │   └── index.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── lib/                # Utility functions and helpers
│   │   └── helpers.ts
│   ├── styles/             # Centralized style definitions
│   │   └── index.ts
│   └── app/                # Main app screens
│       └── [screens]
├── scripts/                # Automation scripts
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── README.md
```

## Architecture Principles

### Separation of Concerns

The codebase is organized by functionality:

- **Components**: Pure UI components with minimal logic
- **Services**: Business logic and external API integration
- **Hooks**: Stateful logic and side effects
- **Constants**: Configuration and magic numbers
- **Types**: Type definitions and interfaces
- **Lib**: Utility and helper functions
- **Styles**: Centralized StyleSheet definitions

### File Organization Rules

1. **One responsibility per file** - Each file should have a clear, single purpose
2. **Descriptive names** - File names should clearly indicate their purpose
3. **Exports** - Each module should export its public interface at the top
4. **Documentation** - Use JSDoc comments for all public functions and components
5. **Related files together** - Group related files in the same directory

## Key Modules

### src/types/index.ts

Centralized TypeScript definitions:
- `FlashMode`, `CameraMode`, `OverlayMode` - Enum-like types
- `MediaItem`, `FocusPoint`, `ViewSize` - Data structures
- State interfaces for camera, UI, and gallery

**When adding new types:**
1. Define in this file with clear documentation
2. Use consistent naming conventions
3. Export all types

### src/constants/index.ts

Static configuration values:
- Overlay options and flash modes
- Mathematical constants (golden ratio, fibonacci)
- Color definitions
- Configuration objects (timeouts, thresholds)

**When adding constants:**
1. Group related values in objects
2. Use UPPER_CASE for primitive constants
3. Add descriptive comments
4. Consider if value should be in app state instead

### src/services/

Business logic and external integrations:

#### mediaLibrary.ts
- Handles all media library operations
- Manages permissions
- Saves and retrieves media
- **Use case**: When working with gallery or file system

#### overlayCalculations.ts
- Pure calculation functions for geometric overlays
- No side effects or state
- Returns data for rendering
- **Use case**: When adding new overlay modes

### src/lib/helpers.ts

General utility functions:
- `pad()`, `formatDuration()` - String formatting
- `clamp()`, `lerp()` - Math operations
- `safeAsync()` - Error handling wrapper
- `debounce()`, `throttle()` - Function utilities

**When adding helpers:**
1. Make them pure functions (no side effects)
2. Add comprehensive JSDoc
3. Include usage examples
4. Keep them generic and reusable

### src/components/overlays/GridOverlay.tsx

Composition guide overlay rendering:
- Supports 9 different overlay modes
- Uses overlay calculations for geometry
- Pure component (no side effects)
- **Modes**: thirds, center, golden, square, diagonal, spiral, triangle, fibonacci, none

### src/components/gallery/

Gallery and media components:

#### VideoItem.tsx
- Renders video with playback controls
- Hooks at component level (useVideoPlayer)
- Pure component

#### VideoThumbnailThumb.tsx
- Generates video thumbnails
- Handles async thumbnail generation
- Fallback UI during loading

### src/hooks/useAICoach.ts

AI coaching logic:
- Analyzes composition score
- Provides composition tips
- Triggers auto-capture
- Configure with threshold and script selection

## Common Tasks

### Adding a New Overlay Mode

1. Add type to `src/types/index.ts`:
   ```typescript
   export type OverlayMode = '...' | 'new-mode';
   ```

2. Add to `src/constants/index.ts`:
   ```typescript
   { mode: 'new-mode', label: 'Label', icon: '🎯' }
   ```

3. Add calculation function in `src/services/overlayCalculations.ts`:
   ```typescript
   export function getNewModeLines(viewW: number, viewH: number) {
     // Return geometry data
   }
   ```

4. Add rendering logic in `src/components/overlays/GridOverlay.tsx`:
   ```typescript
   if (mode === 'new-mode') {
     const lines = getNewModeLines(viewW, viewH);
     // Render using Svg or View components
   }
   ```

5. Add styles to `src/styles/index.ts` if needed

### Adding a New Camera Mode

1. Define type in `src/types/index.ts`
2. Add to appropriate service if it needs business logic
3. Create component in `src/components/`
4. Wire into main screen with state management
5. Document in this file

### Adding a New Setting/Configuration

1. Add constant to `src/constants/index.ts`
2. Add type to `src/types/index.ts` if it has complex structure
3. Create appropriate service/hook for logic
4. Create UI component in `src/components/`

### Creating a New Utility Function

1. Add to `src/lib/helpers.ts`
2. Document with JSDoc including:
   - Purpose
   - Parameters with types
   - Return value and type
   - Example usage if complex
3. Keep function pure (no side effects)
4. Test thoroughly
5. Export from module

## Code Style Guidelines

### TypeScript

- Use strict mode and explicit types
- Avoid `any` type - use `unknown` with type guards
- Use interfaces for props and state
- Prefix component props with `Props` suffix

```typescript
interface GridOverlayProps {
  mode: OverlayMode;
  viewW: number;
  viewH: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ mode, viewW, viewH }) => {
  // Component logic
};
```

### React Components

- Use functional components with hooks
- Keep components focused and single-purpose
- Extract complex logic to custom hooks or services
- Memoize expensive calculations
- Use explicit prop destructuring

```typescript
export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  style,
}) => {
  return (
    // JSX
  );
};
```

### Comments and Documentation

- Use JSDoc for all exported functions
- Explain **why**, not just **what**
- Add section headers for logical groupings
- Keep comments up to date

```typescript
/**
 * @file Service name and purpose
 * Detailed description of what this service does
 */

/**
 * Function purpose
 * @param param1 - Parameter description
 * @returns Description of return value
 */
export function myFunction(param1: string): Promise<Result> {
  // Implementation
}
```

### Naming Conventions

- **Files**: kebab-case (GridOverlay.tsx, useAICoach.ts)
- **Components**: PascalCase (GridOverlay, VideoItem)
- **Functions**: camelCase (formatDuration, calculateDiagonal)
- **Constants**: UPPER_CASE (FLASH_ICONS, GOLDEN_RATIO)
- **Types**: PascalCase (OverlayMode, MediaItem)
- **Styles**: camelCase object names, with descriptive suffix

## Testing Considerations

While working on features:

1. Test type safety with TypeScript compiler
2. Use React DevTools for component inspection
3. Test across different screen sizes
4. Check memory usage with large galleries
5. Verify permission handling on different OS versions
6. Test error cases and edge conditions

## Performance Best Practices

- Use `useCallback` for event handlers passed to children
- Memoize expensive calculations or derived state
- Avoid creating objects/arrays in render functions
- Use `useRef` for values that don't need re-renders
- Profile with React DevTools Profiler
- Keep overlays performant (SVG optimization)

## Common Patterns

### State Management Pattern

```typescript
// In main screen component
const [overlayMode, setOverlayMode] = useState<OverlayMode>('thirds');

// Pass callbacks to children
const handleOverlayChange = useCallback((mode: OverlayMode) => {
  setOverlayMode(mode);
}, []);
```

### Service Pattern

```typescript
// Define async service function
async function saveToLibrary(fileUri: string): Promise<string> {
  try {
    const asset = await MediaLibrary.createAssetAsync(fileUri);
    return asset.uri;
  } catch (error) {
    console.log('Save error:', error);
    return fileUri;
  }
}

// Use in component
const savedUri = await saveToLibrary(fileUri);
```

### Hook Pattern

```typescript
// Encapsulate related state and logic
function useMyFeature(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return { value, handleChange };
}

// Use in component
const { value, handleChange } = useMyFeature('initial');
```

## Debugging Tips

### Common Issues

1. **Module not found errors**: Check import paths and file existence
2. **Type errors**: Run `tsc --noEmit` to check types
3. **Overlay rendering issues**: Use React DevTools to inspect component tree
4. **Performance issues**: Check for unnecessary re-renders with Profiler
5. **Permission errors**: Verify permission requests and Android/iOS differences

### Debug Tools

- React DevTools: Component inspection and prop debugging
- React Native Debugger: Redux, network inspection
- Metro Bundler logs: Build and bundling issues
- Native platform logs: iOS Xcode, Android Logcat

## Pull Request Guidelines

Before submitting:

1. Ensure all files follow the structure and conventions
2. Update types in `src/types/` if adding new concepts
3. Add constants to `src/constants/` for magic numbers
4. Extract reusable logic to services or hooks
5. Update this CONTRIBUTING guide if structure changes
6. Test on both iOS and Android if possible
7. Check for ESLint warnings

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)

## Questions?

If you're unsure about where to place code or how to structure a new feature:

1. Check the directory structure above
2. Look for similar patterns in existing code
3. Refer to the Common Tasks section
4. Ask in pull request comments

Happy coding! 🚀
