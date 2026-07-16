import Logo from "@/components/brand/Logo";
import Button from "@/components/ui/Button";

export function Topbar() {
  return (
    <header className="flex h-12 items-center justify-between border-b border-[var(--bp-border)] bg-[var(--bp-surface)] px-4 md:hidden">
      <Logo variant="dark" style={{ transform: "scale(0.62)", transformOrigin: "left center" }} />
      <Button kind="primary" size="sm">
        Nuevo reporte
      </Button>
    </header>
  );
}

export default Topbar;
