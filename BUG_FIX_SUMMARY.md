# LocaleStrings TypeScript Bug Fix

## Problem Description

The issue was with the `LocaleStrings` type definition in `packages/@uppy/utils/src/Translator.ts`. When used with intersection types like in the Dashboard component:

```typescript
locale?: LocaleStrings<typeof locale> & typeof StatusBarLocale
```

TypeScript would require **all** properties from both types to be present, defeating the purpose of `LocaleStrings` which should allow partial locale strings.

## Root Cause

The original `LocaleStrings` type definition only defined the `strings` property:

```typescript
// BEFORE - Bug version
export type LocaleStrings<T extends NonNullable<OptionalPluralizeLocale>> = {
  strings: Partial<T['strings']>
}
```

This meant that when intersected with another type (like `typeof StatusBarLocale`), TypeScript would require all properties from the intersected type to be present, since `LocaleStrings` only defined the `strings` property.

## Solution

Changed the `LocaleStrings` type to properly handle intersection types by making all properties from the original type optional, while keeping the `strings` property as `Partial<T['strings']>`:

```typescript
// AFTER - Fixed version
export type LocaleStrings<T extends NonNullable<OptionalPluralizeLocale>> = 
  Partial<T> & {
    strings: Partial<T['strings']>
  }
```

## Changes Made

### 1. Updated `packages/@uppy/utils/src/Translator.ts`

- Fixed the `LocaleStrings` type definition to use `Partial<T> & { strings: Partial<T['strings']> }`
- This ensures that when used in intersection types, all properties become optional

### 2. Added test in `packages/@uppy/core/src/types.test.ts`

- Added a test case `LocaleStrings works with intersection types` to verify the fix
- The test ensures that partial locale strings can be used with intersection types without requiring all properties

## Impact

This fix allows developers to use the Dashboard component with partial locale strings as intended:

```typescript
// This now works correctly
<Dashboard 
  locale={{
    strings: {
      uploading: 'Custom uploading text',
      // No need to provide all StatusBar locale strings
    }
  }}
/>
```

## Files Modified

1. `packages/@uppy/utils/src/Translator.ts` - Fixed the `LocaleStrings` type definition
2. `packages/@uppy/core/src/types.test.ts` - Added test case to verify the fix
3. `packages/@uppy/utils/src/Translator.test.ts` - Added import for `LocaleStrings` type

## Verification

The test case added demonstrates that:
- Partial locale strings can be used with intersection types
- TypeScript compilation succeeds without requiring all properties from the intersected type
- The fix maintains backward compatibility

This resolves the issue where users had to provide all locale strings even when they only wanted to override specific ones in the Dashboard component.