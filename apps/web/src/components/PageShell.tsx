export function PageShell({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={`mx-auto px-4 py-8 md:px-6 md:py-12 ${narrow ? "max-w-lg" : "max-w-6xl"}`}>
      {children}
    </div>
  );
}
