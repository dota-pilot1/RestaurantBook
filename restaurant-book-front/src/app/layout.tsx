import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "./QueryProvider";
import { AuthInitializer } from "./AuthInitializer";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { ThemeInitializer } from "@/shared/ui/theme/ThemeInitializer";
import { I18nProvider } from "@/shared/i18n/I18nProvider";

const themeNoFlashScript = `(function(){try{var t=localStorage.getItem("theme-color");if(t&&t!=="default")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RestaurantBook",
  description: "테이블 키오스크 주문 시스템",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RestaurantBook",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeNoFlashScript }} />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#09090b" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeInitializer />
        <I18nProvider>
          <QueryProvider>
            <AuthInitializer>
              <Header />
              {children}
              <Footer />
            </AuthInitializer>
          </QueryProvider>
        </I18nProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
