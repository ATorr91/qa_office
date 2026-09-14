import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/capacitacion/Navbar";
import RoofOrnament from "@/components/capacitacion/RoofOrnament";
import "./capacitacion.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  weight: ["600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Capacitación — LGPSM",
  description: "Espacio de capacitación: prototipos interactivos LGPSM",
};

export default function CapacitacionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${plusJakartaSans.variable} antialiased min-h-screen flex flex-col`}
    >
      <div className="fixed top-0 inset-x-0 z-50 flex flex-col">
        <Navbar />
        <RoofOrnament />
      </div>
      {children}
    </div>
  );
}
