export const metadata = {
  title: 'Bangla PDF Pro V2',
  description: 'Practical Bangla PDF editing with overlay tools'
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
