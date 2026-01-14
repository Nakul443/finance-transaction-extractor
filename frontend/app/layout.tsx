// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vessify Finance Extractor",
  description: "Extract transactions from bank statements securely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* <AuthProvider> */}
          {children}
          <Toaster position="top-right" />
        {/* </AuthProvider> */}
      </body>
    </html>
  );
}