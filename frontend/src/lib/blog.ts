export function blogDate(value: string | null): string {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(value),
  );
}
