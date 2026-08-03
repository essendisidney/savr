export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-card-lg border border-dashed border-savr-ink/12 bg-white/80 px-6 py-12 text-center shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-sm animate-popIn">
      <p className="font-display text-xl font-bold tracking-tightish text-savr-ink">{title}</p>
      {body ? (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-savr-mute">{body}</p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center animate-rise-delay">{action}</div> : null}
    </div>
  );
}
