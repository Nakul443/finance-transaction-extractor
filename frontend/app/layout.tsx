// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/auth-provider"; // [1] IMPORT UNCOMMENTED
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers"

const fontClass = "font-sans";

export const metadata: Metadata = {
  title: "Vessify Finance Extractor",
  description: "Extract transactions from bank statements securely",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}