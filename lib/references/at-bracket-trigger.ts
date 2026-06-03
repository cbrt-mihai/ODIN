/** User types `@[` to open the insert-reference wizard. */
export const AT_BRACKET_REFERENCE_TRIGGER = "@[";

/**
 * True when the text before the cursor ends with `@[` (reference wizard trigger).
 */
export function shouldOpenReferenceWizard(value: string, cursor: number): boolean {
  if (cursor < 2) return false;
  return value.slice(0, cursor).endsWith(AT_BRACKET_REFERENCE_TRIGGER);
}

/**
 * Removes the `@[` trigger immediately before the cursor.
 */
export function stripAtBracketReferenceTrigger(
  value: string,
  cursor: number,
): { nextValue: string; nextCursor: number } {
  const nextValue =
    value.slice(0, cursor - AT_BRACKET_REFERENCE_TRIGGER.length) +
    value.slice(cursor);
  return {
    nextValue,
    nextCursor: cursor - AT_BRACKET_REFERENCE_TRIGGER.length,
  };
}
