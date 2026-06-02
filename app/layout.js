import "./globals.css";
import { Teko, Jost } from "next/font/google";
import { StoreProvider } from "@/app/lib/store/StoreProvider";
import AuthProvider from "@/app/lib/store/AuthProvider";
import ErrorMsg from "./components/ui/ErrorMsg";
import NavigationWrapper from "./layout/navigation/NavigationWrapper";
import Footer from "./layout/footer/Footer";
import MobileNavBar from "./layout/navigation/MobileNavBar";
import WelcomeUser from "./components/materials/WelcomeUser";
import ModalRoot from "./components/modals/ModalRoot";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "400", "500", "900"],
  display: "swap",
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const siteUrl = "https://soundfolio.net";

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Soundfolio",
    template: "%s | Soundfolio",
  },

  description:
    "Soundfolio is an electronic music community for discovering DJs, artists, clubs, festivals, and live events.",

  applicationName: "Soundfolio",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Soundfolio",
    title: "Soundfolio",
    description:
      "Discover DJs, artists, clubs, festivals, and live events with Soundfolio.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Soundfolio",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Soundfolio",
    description:
      "Discover DJs, artists, clubs, festivals, and live events with Soundfolio.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: "/apple-icon.png",
  },

  category: "music",
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: "Soundfolio",
        alternateName: ["soundfolio.net", "Soundfolio.net"],
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Soundfolio",
        url: `${siteUrl}/`,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/icon.png`,
        },
        sameAs: ["https://www.instagram.com/soundfolio"],
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://ucyhmkyjbrfbcediafwo.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://ucyhmkyjbrfbcediafwo.supabase.co"
        />
        <link rel="preconnect" href="https://api.bigdatacloud.net" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>

      <body
        className={`${jost.variable} ${teko.variable} min-h-screen relative flex flex-col duration-300 bg-black text-gold mx-auto max-w-[1800px]`}
      >
        <StoreProvider>
          <AuthProvider>
            <NavigationWrapper />
            <main id="main-content">{children}</main>
            <ErrorMsg />
            <ModalRoot />
            <MobileNavBar />
            <WelcomeUser />
            <Footer />
          </AuthProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
