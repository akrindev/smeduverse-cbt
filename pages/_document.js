import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const initalProps = await Document.getInitialProps(ctx)

        return initalProps
    }

    render() {
        return (
            <Html>
                <Head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
                    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@200;300;400;600;700;800;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Roboto:wght@300;400&display=swap" rel="stylesheet" />
                    <link rel="shortcut icon" href="/assets/images/tutwurihandayani.png" type="image/png" />
                    <link rel="stylesheet" href="/assets/ckstyles.css" />
                </Head>
                <body className="antialiased">
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument