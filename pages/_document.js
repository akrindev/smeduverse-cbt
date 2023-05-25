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
