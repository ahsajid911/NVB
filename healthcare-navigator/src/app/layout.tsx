import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import AIChatPanel from "@/components/features/AIChatPanel";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const metadata: Metadata = {
  title: {
    default: "Healthcare Navigator Bangladesh - Find Doctors & Hospitals",
    template: "%s | HealthNav BD",
  },
  description:
    "Free healthcare platform to find doctors, specialists, and hospitals across Bangladesh. Search by symptoms, specialty, or location.",
  keywords: [
    "Doctor Bangladesh",
    "Specialist Doctor",
    "Hospital Directory",
    "Healthcare Bangladesh",
    "Find Doctor",
    "Symptom Checker",
  ],
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "Healthcare Navigator Bangladesh",
    title: "Healthcare Navigator Bangladesh",
    description: "Find the right doctors and hospitals across Bangladesh",
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare Navigator Bangladesh",
    description: "Find the right doctors and hospitals across Bangladesh",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Healthcare Navigator Bangladesh",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://healthnav-bd.vercel.app",
              description:
                "Free healthcare navigation platform to find doctors, specialists, and hospitals in Bangladesh",
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="min-h-screen">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
          <AIChatPanel />
        </LanguageProvider>
      </body>
    </html>
  );
}
