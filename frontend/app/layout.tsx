// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../components/auth-provider"; // [1] IMPORT UNCOMMENTED
import { Toaster } from "sonner";

const fontClass = "font-sans";

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
      <body className={fontClass}>
        {/* [2] WRAPPER UNCOMMENTED - This powers all auth hooks like useSession() */}
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}