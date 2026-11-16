import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#F5F7FA" />
        <meta
          name="description"
          content="Folio — a private, local-first credit and debit ledger for the people you share money with."
        />
        <title>Folio · Personal ledger</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const pageStyles = `
  html, body {
    height: 100%;
    background: #EDF1F6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    margin: 0;
    overscroll-behavior: none;
  }
  #root {
    display: flex;
    height: 100%;
    min-height: 100%;
  }
  ::selection {
    background: #CFE0FC;
  }
  @media (max-width: 700px) {
    html, body { background: #F5F7FA; }
  }
`;
