import type { CSSProperties } from "react";

/**
 * A whole number (optionally with %) that counts up from 0 when it appears. The count is drawn by CSS from a counter, so the page
 * keeps the real text for screen readers and the final value is what shows without animation. Anything else renders as is.
 * Give it a `key` equal to the value so it counts again when the value changes.
 */
export function CountUp({ value }: { value: string }) {
  const m = /^(\d{1,6})(%?)$/.exec(value.trim());
  if (!m) return <>{value}</>;
  const style = { "--bp-n": Number(m[1]), "--bp-suffix": m[2] ? '"%"' : '""' } as CSSProperties;
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="bp-count tabular-nums" style={style} />
    </>
  );
}

export default CountUp;
