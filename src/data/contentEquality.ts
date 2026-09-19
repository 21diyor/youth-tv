/** Structural equality for content objects (key order independent). */
export function isSameContent(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every((key) =>
    isSameContent(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  )
}
