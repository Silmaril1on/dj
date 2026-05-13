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
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const siteUrl = process.env.PROJECT_URL || "https://soundfolio.net";

export const metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Soundfolio",
    template: "%s | Soundfolio",
  },
  description:
    "Discover DJs, artists, clubs, festivals and live events. Connect with the global electronic music and nightlife community.",
  applicationName: "Soundfolio",
  keywords: [
    "Soundfolio",
    "electronic music",
    "DJ platform",
    "music community",
    "festivals",
    "clubs",
    "artists",
    "events",
    "techno",
    "house music",
    "edm",
    "nightlife",
  ],
  authors: [
    {
      name: "Levan Chikovani",
      url: siteUrl,
    },
  ],
  creator: "Levan Chikovani",
  publisher: "Levan Chikovani",
  alternates: {
    canonical: siteUrl,
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
    description: "Discover DJs, artists, clubs, festivals and live events.",
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
    description: "Discover DJs, artists, clubs, festivals and live events.",
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
    "@type": "WebSite",
    name: "Soundfolio",
    alternateName: "Soundfolio",
    url: siteUrl,
    description: "Discover DJs, artists, clubs, festivals and live events.",
  };

  return (
    <html lang="en">
      <head>
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

            {children}

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
