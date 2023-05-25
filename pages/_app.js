import "tailwindcss/tailwind.css";
import "react-toastify/dist/ReactToastify.min.css";
import "../assets/ckstyles.css";
import Script from "next/script";
import { Nunito, Poppins, Roboto } from "next/font/google";

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
  weight: ["300", "400", "600", "700"],
});

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Script
        src='https://www.googletagmanager.com/gtag/js?id=G-GWKJDQTDRW'
        strategy='afterInteractive'
      />
      <Script id='google-analytics' strategy='afterInteractive'>
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
