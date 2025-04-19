import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NextAuthProvider } from "@/components/NextAuthProvider";


export const metadata: Metadata = {
  title: {
    template: '%s - Summit',
    default: 'Summit - Internal Invoicing App',
  },
  description: "Financial essentials, nothing more.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico"
    },
    {
      rel: "apple-touch-icon",
      url: "/apple-icon.png"
    },
    {
      rel: "manifest",
      url: "/site.webmanifest"
    },
  ],
  openGraph: {
    images: 'https://summit.kugie.dev/og-image.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Summit',
    description: 'Financial essentials, nothing more.',
    creator: 'Summit',
    images: ['https://summit.kugie.dev/og-image.png'],
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-4">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  )
}
