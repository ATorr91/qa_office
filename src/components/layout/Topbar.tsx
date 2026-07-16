import Logo from "@/components/brand/Logo";
import Button from "@/components/ui/Button";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--bp-border)] bg-[var(--bp-surface)] px-5 md:hidden">
      <Logo variant="dark" style={{ transform: "scale(0.75)", transformOrigin: "left center" }} />
      <Button kind="primary" className="px-4 py-2 text-sm">
        Nuevo reporte
      </Button>
    </header>
  );
}

export default Topbar;
