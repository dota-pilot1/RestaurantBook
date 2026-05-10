export function StatePanel({
  message,
  tone = "muted",
}: {
  message: string;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={`flex min-h-64 items-center justify-center rounded-lg border border-border bg-background p-6 text-sm ${
        tone === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {message}
    </div>
  );
}
