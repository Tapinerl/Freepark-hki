export const DURATION_OPTIONS = [
  { label: "30 Minutes", value: 30 },
  { label: "1 Hour", value: 60 },
  { label: "2 Hours", value: 120 },
  { label: "4 Hours", value: 240 },
  { label: "8 Hours", value: 480 },
  { label: "12+ Hours", value: 720 },
];

export function toggleDuration(current: number[], duration: number): number[] {
  if (current.includes(duration)) return current.filter((value) => value !== duration);
  return [...new Set([
    ...current,
    ...DURATION_OPTIONS.filter((option) => option.value <= duration).map((option) => option.value),
  ])].sort((a, b) => a - b);
}

export function matchesDuration(minutes: number | null, selected: number[]): boolean {
  // Each spot belongs to one range. Longer stays cannot reinclude an
  // explicitly unchecked shorter range. Unlimited stays use 12+ hours.
  const bucket = minutes === null
    ? 720
    : (DURATION_OPTIONS.find((option) => minutes <= option.value)?.value ?? 720);
  return selected.includes(bucket);
}
