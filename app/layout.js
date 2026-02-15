import "@/app/globals.css";
import Providers from "@/contexts/Providers";

import Script from "next/script";
import Footer from "@/components/common/Footer/Footer";
import NavBar from "@/components/common/NavBar";
import { Toaster } from "@/components/ui/sonner";



export const metadata = {
  title: "CLEAN: A Thirty Mighty Men Ministries Program",
  description: "CLEAN: A Thirty Mighty Men Ministries Program",
  keywords:
    "30 Men Ministries, the-carpenters-son, thecleanprogram, Donovan Anderson",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-KQBNXMFH0L"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KQBNXMFH0L');
          `}
        </Script>
      </head>
      <body className={`antialiased`}>
        <Providers>
          <NavBar />
          <main className="mt-16 sm:mt-20">{children}</main>
          <Toaster />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
