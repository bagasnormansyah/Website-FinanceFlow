export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute -top-40 -left-32 size-96 rounded-full bg-blue-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-40 size-96 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </main>
  );
}
