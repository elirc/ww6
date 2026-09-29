import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "FinOps Chargeback Platform",
  description: "Infrastructure cost allocation and chargeback dashboard"
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
