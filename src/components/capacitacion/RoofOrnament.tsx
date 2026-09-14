"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import roofOrnament from "../../../public/capacitacion/roof-ornament.png";
import CharacterCurtain from "./CharacterCurtain";

export default function RoofOrnament() {
  const pathname = usePathname();

  if (pathname !== "/capacitacion/lab") return null;

  return (
    <div className="flex justify-center pointer-events-none w-full">
      <div className="relative w-full max-w-[min(90vw,42rem)]">
        <Image
          src={roofOrnament}
          alt=""
          priority
          className="relative z-10 w-full h-auto select-none"
          style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.22))" }}
        />
        <CharacterCurtain />
      </div>
    </div>
  );
}
