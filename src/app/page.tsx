import Logo from "@/components/brand/Logo";
import ProjectsRegistry from "@/components/home/ProjectsRegistry";

export default function HomePage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center px-6 py-12"
      style={{ background: "var(--bp-gradient-cover)" }}
    >
      {/* Same max width as the table so the logo lines up with its left edge. */}
      <div className="w-full max-w-5xl">
        {/* The logo is 240×30 at full size; the wrapper reserves the scaled-down box so layout matches. */}
        <div style={{ width: 144, height: 18 }}>
          <Logo variant="white" style={{ transform: "scale(0.6)", transformOrigin: "top left" }} />
        </div>
      </div>

      <ProjectsRegistry />
    </div>
  );
}
