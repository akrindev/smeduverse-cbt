import "tailwindcss/tailwind.css";
import "react-toastify/dist/ReactToastify.min.css";
import "../assets/ckstyles.css";
import Script from "next/script";
import { Nunito, Poppins, Roboto } from "next/font/google";
import Head from "next/head";

export const inter = Nunito({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "600", "700"],
});

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "600", "700"],
});

export const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["300", "400", "700"],
});

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-GWKJDQTDRW"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-GWKJDQTDRW');
        `}
      </Script>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
