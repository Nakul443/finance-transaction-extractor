// app/layout.tsx

// defines the global HTML structure
// the website has a permanent frame that stays the same on every page
// children is the middle part that changes when you click to a different page
// the layout stays same, only the {children} part changes

// Flow
// browser requests a page (eg: /dashboard)
// -> next.js loads layout.tsx (universal frame)
// -> initializes providers
// -> injects page content (code for /dashboard is placed exactly where {childern} is written)
// -> renders UI components
// -> final HTML sent to the browser


import type { Metadata } from "next"; 
import "./globals.css";
import { AuthProvider } from "../components/auth-provider";
import { Toaster } from "sonner"; // notification component from sonner library
import { Providers } from "@/components/Providers" // provide global features like user authentication or data fetching

const fontClass = "font-sans"; // CSS class for fonts

// describes for content of a webpage
// metadata for all pages
export const metadata: Metadata = {
  title: "Finance Extractor",
  description: "Extract transactions from bank statements securely",
};

// {children} is a placeholder, represents whatever page user is currently visiting
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