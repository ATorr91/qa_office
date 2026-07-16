import type { Metadata } from "next";
import { Red_Hat_Display, Open_Sans, Dela_Gothic_One } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const redHatDisplay = Red_Hat_Display({
  variable: "--font-red-hat-display",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const delaGothicOne = Dela_Gothic_One({
  variable: "--font-dela-gothic-one",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QA Office",
  description: "Reportes instantáneos de métricas de QA para los proyectos de la empresa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${redHatDisplay.variable} ${openSans.variable} ${delaGothicOne.variable} antialiased`}
    >
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
