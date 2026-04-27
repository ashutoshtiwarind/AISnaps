# Code Quality & Structure Checklist

Use this checklist when adding new code to ensure it follows the refactored architecture.

## Before Writing Code

- [ ] **Plan the feature** - Understand what needs to be built
- [ ] **Identify modules** - Decide which folders will be involved
- [ ] **Check existing** - Is there similar code that can be reused?
- [ ] **Review structure** - Do I need new types, constants, or utilities?

## While Writing Code

### Types
- [ ] **Defined in `src/types/index.ts`** - New types go in types folder
- [ ] **Exported properly** - Type is exported from index.ts
- [ ] **Well documented** - Has JSDoc comment explaining the type
- [ ] **Used consistently** - Same type used everywhere it applies
- [ ] **No hardcoded values** - Related constants extracted

### Constants
- [ ] **In `src/constants/index.ts`** - All magic numbers here
- [ ] **Grouped logically** - Related constants in same object
- [ ] **Named clearly** - Name reflects purpose (UPPER_CASE for primitives)
- [ ] **Documented** - Comments explain what the constant does
- [ ] **Type safe** - Has proper type annotations

### Services
- [ ] **Pure functions** - No side effects (no state changes)
- [ ] **Single responsibility** - One service, one purpose
- [ ] **Error handling** - All promises have error handling
- [ ] **Well documented** - JSDoc on all functions
- [ ] **Exported from index.ts** - Available via `src/services`
- [ ] **No React dependencies** - Services work independently

### Hooks
- [ ] **In `src/hooks/useHookName.ts`** - Named with `use` prefix
- [ ] **Uses React hooks** - Leverages useState, useEffect, etc.
- [ ] **Encapsulates logic** - Related state and effects together
- [ ] **Well documented** - JSDoc explains hook purpose
- [ ] **Exported from index.ts** - Available via `src/hooks`
- [ ] **Returns clear interface** - Well-defined return type

### Components
- [ ] **In `src/components/[category]/`** - Organized by category
- [ ] **Functional component** - Uses React.FC pattern
- [ ] **Props interface** - Has TypeScript props interface
- [ ] **Pure component** - No direct side effects
- [ ] **Well documented** - JSDoc comment on component
- [ ] **Exported from index.ts** - Available via `src/components`
- [ ] **Reusable** - Not tied to specific screen logic
- [ ] **Styled properly** - Uses styles from `src/styles`

### Utilities
- [ ] **In `src/lib/helpers.ts`** - General utilities here
- [ ] **Pure functions** - No side effects
- [ ] **Well typed** - Full TypeScript annotations
- [ ] **Well documented** - JSDoc with examples
- [ ] **Generic** - Useful beyond specific use case
- [ ] **Tested** - Works correctly with edge cases

### Styles
- [ ] **In `src/styles/index.ts`** - All styles centralized
- [ ] **Logically grouped** - Related styles in same object
- [ ] **Named clearly** - Describes what element it styles
- [ ] **Consistent naming** - Follows existing naming pattern
- [ ] **No hardcoded colors** - Use OVERLAY_COLORS or define constant
- [ ] **Responsive** - Considers different screen sizes

### Main App Screen
- [ ] **Clean and focused** - Only screen logic
- [ ] **Uses components** - Complex UI extracted to components
- [ ] **Uses services** - Business logic delegated
- [ ] **Uses hooks** - State logic in custom hooks
- [ ] **Imports from index files** - Uses centralized exports
- [ ] **Well organized** - Code sections clearly commented

## After Writing Code

### Structure Check
- [ ] **No circular imports** - Modules don't depend on each other circularly
- [ ] **Proper exports** - All public APIs exported
- [ ] **No duplicated code** - DRY principle followed
- [ ] **Clear file purposes** - Each file has one responsibility
- [ ] **Logical organization** - Related code grouped together

### Type Safety
- [ ] **TypeScript strict mode** - Code compiles without errors
- [ ] **No `any` types** - Use specific types or `unknown`
- [ ] **All parameters typed** - Functions have type annotations
- [ ] **Return types specified** - Functions declare return types
- [ ] **Types exported** - All types available for imports

### Documentation
- [ ] **JSDoc comments** - All public APIs documented
- [ ] **Complex logic explained** - Inline comments for unclear code
- [ ] **Parameter descriptions** - What each param does
- [ ] **Return value documented** - What function returns
- [ ] **Examples included** - For complex functions

### Testing Readiness
- [ ] **Pure functions** - Services testable independently
- [ ] **Clear dependencies** - What each module depends on clear
- [ ] **Error handling** - Graceful handling of edge cases
- [ ] **Edge cases considered** - Empty arrays, null values, etc.
- [ ] **Mockable** - Dependencies can be mocked for testing

## Code Review Checklist

When reviewing code, ensure:

### Architecture
- [ ] **Follows structure** - Uses appropriate folders
- [ ] **Separation of concerns** - Each module has clear purpose
- [ ] **No violations** - Doesn't break existing patterns
- [ ] **Reuses existing** - Doesn't duplicate functionality
- [ ] **Imports correct** - Uses centralized exports

### Quality
- [ ] **Well documented** - Clear and complete documentation
- [ ] **Type safe** - Proper TypeScript usage
- [ ] **Error handling** - Handles failures gracefully
- [ ] **Performance** - No obvious performance issues
- [ ] **Maintainability** - Easy to understand and modify

### Testing
- [ ] **Testable code** - Can be unit tested easily
- [ ] **Edge cases** - Handles error scenarios
- [ ] **Works as expected** - Functionality is correct
- [ ] **Doesn't break existing** - No regression issues

## Common Anti-Patterns to Avoid

❌ **Don't Do This**
```typescript
// Mixing concerns in component
const MyComponent = () => {
  // API call directly in component
  useEffect(() => {
    fetch('/api/data').then(...)
  }, [])
  
  // Business logic in component
  const score = data.length > 10 ? 100 : data.length * 10;
  
  // Hardcoded values
  return <View style={{ marginLeft: 16 }}> ... </View>
}
```

✅ **Do This Instead**
```typescript
// Business logic in service
export const calculateScore = (data: any[]) => {
  return data.length > 10 ? 100 : data.length * 10;
}

// API calls in hook or service
export const fetchData = async () => {
  const response = await fetch('/api/data');
  return response.json();
}

// Constants defined
export const SPACING = { MEDIUM: 16 };

// Clean component
const MyComponent = () => {
  const { data, isLoading } = useFetchData();
  const score = calculateScore(data);
  
  return <View style={{ marginLeft: SPACING.MEDIUM }}> ... </View>
}
```

## Performance Checklist

- [ ] **No unnecessary re-renders** - useCallback for callbacks
- [ ] **Expensive calcs memoized** - useMemo for heavy operations
- [ ] **Large lists optimized** - FlatList instead of ScrollView
- [ ] **Images optimized** - Proper sizing and caching
- [ ] **No memory leaks** - useEffect cleanup functions
- [ ] **Efficient selectors** - Only derive what's needed

## Accessibility Checklist

- [ ] **Text contrast** - Readable text on backgrounds
- [ ] **Touch targets** - Buttons at least 44x44 points
- [ ] **Keyboard navigation** - Works without touch
- [ ] **Screen reader ready** - Proper accessibility labels
- [ ] **Color not only** - Don't rely only on color for meaning

## Testing Checklist

Before merging:
- [ ] **Component renders** - No crashes on render
- [ ] **Interactions work** - Button presses, swipes, etc.
- [ ] **Edge cases handled** - Empty states, errors, etc.
- [ ] **Responsive** - Works on different screen sizes
- [ ] **Performance ok** - No noticeable lag
- [ ] **iOS tested** - Works on iOS
- [ ] **Android tested** - Works on Android

---

## Quick Audit Script

Run this to check structure compliance:

```bash
# Check all files are in correct folders
find src -type f -name "*.tsx" | grep -v components
find src -type f -name "*.ts" | grep -v "types|constants|styles|services|lib|hooks"

# Check all exports exist
grep -r "export" src/types/index.ts
grep -r "export" src/constants/index.ts
```

---

**Note**: This checklist helps maintain code quality. Adapt it as the project evolves!
