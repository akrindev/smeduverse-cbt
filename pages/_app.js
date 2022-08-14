import "tailwindcss/tailwind.css";
import "react-toastify/dist/ReactToastify.min.css";
import "../assets/ckstyles.css";
import Script from "next/script";

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
