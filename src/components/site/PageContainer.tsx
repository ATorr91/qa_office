/** Padding and a readable maximum width for the process pages (the dashboard brings its own layout). */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-5 py-6 md:px-8 lg:px-10 lg:py-8 print:p-0">
      <div className="mx-auto max-w-[1180px]">{children}</div>
    </main>
  );
}

export default PageContainer;
