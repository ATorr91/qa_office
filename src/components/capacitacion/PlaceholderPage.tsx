export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="min-h-screen bg-white text-black font-jakarta flex flex-col items-center justify-center text-center px-6">
      <h1
        className="font-orbitron font-extrabold uppercase"
        style={{ letterSpacing: "0.08em", fontSize: "var(--headline)" }}
      >
        {title}
      </h1>
      <p
        className="text-gray-500 mt-4"
        style={{ fontSize: "var(--body)" }}
      >
        Content coming soon.
      </p>
    </section>
  );
}
