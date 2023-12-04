import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initalProps = await Document.getInitialProps(ctx);

    return initalProps;
  }

  render() {
    return (
      <Html lang='id'>
        <Head>
          <meta name='google' content='notranslate' />
          <link
            rel='shortcut icon'
            href='/assets/images/tutwurihandayani.png'
            type='image/png'
          />
          <meta name='application-name' content='Smeduverse CBT' />
          <meta name='apple-mobile-web-app-capable' content='yes' />
          <meta
            name='apple-mobile-web-app-status-bar-style'
            content='default'
          />
          <meta name='apple-mobile-web-app-title' content='Smeduverse CBT' />
          <meta name='description' content='Computer based test' />
          <meta name='format-detection' content='telephone=no' />
          <meta name='mobile-web-app-capable' content='yes' />
          <meta name='msapplication-TileColor' content='#2B5797' />
          <meta name='msapplication-tap-highlight' content='no' />
          <meta name='theme-color' content='#000000' />

          <link
            rel='icon'
            type='image/png'
            sizes='32x32'
            href='/assets/images/tutwurihandayani.png'
          />
          <link
            rel='icon'
            type='image/png'
            sizes='16x16'
            href='/assets/images/tutwurihandayani.png'
          />
          <link rel='manifest' href='/manifest.json' />
          <link rel='shortcut icon' href='/favicon.ico' />

          <meta property='og:type' content='website' />
          <meta property='og:title' content='Smeduverse CBT' />
          <meta property='og:description' content='Computer Based Test' />
          <meta property='og:site_name' content='Smeduverse CBT' />
          <meta
            property='og:url'
            content={process.env.NEXT_PUBLIC_BACKEND_URL}
          />
          <meta
            property='og:image'
            content={`${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/images/tutwurihandayani.png`}
          />
          <meta
            name='viewport'
            content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover'
          />
        </Head>
        <body className='antialiased'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
