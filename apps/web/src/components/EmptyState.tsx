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
    <div className="border border-dashed border-savr-ink/15 bg-white/60 px-6 py-12 text-center backdrop-blur-sm">
      <p className="font-display text-xl font-bold tracking-tightish text-savr-ink">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-savr-mute">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
