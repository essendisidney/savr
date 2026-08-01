export function PageShell({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={`mx-auto px-4 py-7 md:px-6 md:py-12 ${narrow ? "max-w-md" : "max-w-5xl"}`}
    >
      {children}
    </div>
  );
}
