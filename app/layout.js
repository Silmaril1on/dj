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

const josh = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Soundfolio",
  description:
    "Soundfolio — discover DJs, artists, clubs, festivals and live events. Connect with the music production world.",
  metadataBase: new URL(process.env.PROJECT_URL || "https://soundfolio.net"),
  openGraph: {
    siteName: "Soundfolio",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` ${josh.variable} ${teko.variable} min-h-screen relative flex flex-col duration-300 bg-black text-gold mx-auto max-w-[1800px]`}
      >
        <StoreProvider>
          <AuthProvider>
            {/* <SmoothScroll> */}
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
