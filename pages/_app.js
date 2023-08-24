import Script from 'next/script';
import Head from 'next/head';
import '../src/App.css';

export default function MyApp({ Component, pageProps }) {
  return (
  <>
   <Head>
      <title>Pip Tracker</title>
    </Head>
    <Component {...pageProps} />
  </>
  );
}