import "lenis/dist/lenis.css";
import "./globals.css";

import LenisProvider from "@/components/providers/LenisProvider";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";

export const metadata = {
    title: "ImagineCo",
    // description: "MAY 2026",
};

export const viewport = {
    themeColor: "#fef0d0",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <LenisProvider>
                    <Header />
                    {children}
                    <Footer />
                </LenisProvider>
            </body>
        </html>
    );
}