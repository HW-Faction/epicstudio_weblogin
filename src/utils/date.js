export function parseDate(dateStr) {
  if (!dateStr) return null;

  // assuming format like "2026-04-13"
  return new Date(dateStr);
}

export function isToday(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return false;

  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isOverdue(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return false;

  const today = new Date();
  return d < today;
}