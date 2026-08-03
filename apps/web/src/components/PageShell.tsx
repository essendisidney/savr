export function PageShell({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={`mx-auto px-4 py-9 md:px-6 md:py-12 ${narrow ? "max-w-md" : "max-w-5xl"}`}
    >
      {children}
    </div>
  );
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  return <div className="page-band relative min-h-[70vh] pb-6">{children}</div>;
}
