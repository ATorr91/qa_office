export default function Checkerboard({ className = "" }: { className?: string }) {
  const square = 3.8;
  const pitch = 4.5;
  const cols = 8;
  const rows = 4;
  const rects: React.ReactNode[] = [];

  for (let row = 0; row < rows; row++) {
    const shift = row % 2 === 1 ? 2.25 : 0;
    for (let col = 0; col < cols; col++) {
      if ((col + row) % 2 !== 0) continue;
      rects.push(
        <rect
          key={`${row}-${col}`}
          className="checker-square"
          x={col * pitch + shift}
          y={row * pitch}
          width={square}
          height={square}
          fill="black"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      );
    }
  }

  return (
    <svg
      viewBox="0 0 36 18"
      className={className}
      style={{
        width: "var(--checker-w)",
        height: "var(--checker-h)",
        transform: "translateY(2px)",
      }}
    >
      {rects}
    </svg>
  );
}
