# LocaleStrings Type Intersection Fix

## Problem Description

The `LocaleStrings` type in Uppy had a bug when used in intersection types, particularly in the Dashboard component. Users reported that when trying to use partial locale overrides, TypeScript would require them to provide **all** strings from both locales instead of allowing partial overrides.

### Original Issue

The Dashboard component defined its locale type as:
```typescript
locale?: LocaleStrings<typeof locale> & typeof StatusBarLocale
```

This intersection type meant users had to provide:
1. Partial Dashboard strings (from `LocaleStrings<typeof locale>`)
2. **Complete** StatusBar locale object (from `typeof StatusBarLocale`)

This defeated the purpose of `LocaleStrings`, which should allow partial overrides.

### Example of the Problem

```typescript
// This SHOULD work but didn't:
const dashboardWithCustomLocale = new Dashboard(uppy, {
  locale: {
    strings: {
      closeModal: 'Custom Close Modal', // Only want to override this one string
      // But TypeScript required ALL StatusBar strings too!
    }
  }
})
```

## Root Cause

The issue was in the `LocaleStrings` type definition in `packages/@uppy/utils/src/Translator.ts`:

```typescript
export type LocaleStrings<T extends NonNullable<OptionalPluralizeLocale>> = {
  strings: Partial<T['strings']>  // strings property was required
}
```

When intersected with `typeof StatusBarLocale`, the intersection `&` operator required both:
- `strings: Partial<DashboardLocale['strings']>` (from LocaleStrings)
- `strings: StatusBarLocale['strings']` (from typeof StatusBarLocale)

Since both had required `strings` properties, TypeScript required the union of both, defeating the partial nature.

## Solution

### 1. Fixed LocaleStrings Type Definition

Changed the `strings` property to be optional in `LocaleStrings`:

```typescript
export type LocaleStrings<T extends NonNullable<OptionalPluralizeLocale>> = {
  strings?: Partial<T['strings']>  // Made strings optional
}
```

### 2. Fixed Dashboard Locale Type

Changed the Dashboard locale type to use `LocaleStrings` for both locales:

```typescript
// Before:
locale?: LocaleStrings<typeof locale> & typeof StatusBarLocale

// After:
locale?: LocaleStrings<typeof locale> & LocaleStrings<typeof StatusBarLocale>
```

This ensures both Dashboard and StatusBar strings are treated as optional partials.

### 3. Updated Translator Class

The `Translator` class already handled optional strings correctly:

```typescript
#apply(locale?: OptionalPluralizeLocale): void {
  if (!locale?.strings) {  // Already handled undefined strings
    return
  }
  // ... rest of the method
}
```

## Benefits of the Fix

1. **Partial Overrides**: Users can now override just specific strings from either locale
2. **Backward Compatibility**: Existing code continues to work unchanged
3. **Type Safety**: TypeScript still provides full type checking for provided strings
4. **Flexibility**: Users can provide any combination of Dashboard and StatusBar string overrides

## Usage Examples

After the fix, all of these work correctly:

```typescript
// Override just one Dashboard string
const dashboard1 = new Dashboard(uppy, {
  locale: {
    strings: {
      closeModal: 'Custom Close Modal',
    }
  }
})

// Override just one StatusBar string
const dashboard2 = new Dashboard(uppy, {
  locale: {
    strings: {
      uploading: 'Custom Uploading...',
    }
  }
})

// Override strings from both locales
const dashboard3 = new Dashboard(uppy, {
  locale: {
    strings: {
      closeModal: 'Custom Close Modal',
      uploading: 'Custom Uploading...',
      complete: 'All Done!',
    }
  }
})

// No strings at all (use all defaults)
const dashboard4 = new Dashboard(uppy, {
  locale: {} // Empty locale object
})
```

## Testing

Added comprehensive tests in `packages/@uppy/utils/src/Translator.test.ts` to verify:

1. Intersection types work correctly with partial strings
2. Both Dashboard and StatusBar strings are optional
3. Empty locale objects are handled gracefully
4. The Translator class processes partial locales correctly

## Files Modified

1. `packages/@uppy/utils/src/Translator.ts` - Fixed LocaleStrings type
2. `packages/@uppy/dashboard/src/Dashboard.tsx` - Fixed Dashboard locale type
3. `packages/@uppy/utils/src/Translator.test.ts` - Added comprehensive tests

## Impact

This fix resolves the issue mentioned in the bug report where users had to provide complete locale objects even when they only wanted to override specific strings. The fix maintains backward compatibility while providing the flexibility users expected from the `LocaleStrings` type.