export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--bp-radius-sm)] bg-[var(--bp-border)]/60 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[bp-shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  );
}

export default Skeleton;
