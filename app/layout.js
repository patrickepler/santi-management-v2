import './globals.css';

export const metadata = {
  title: 'Santi Management',
  description: 'Sustainable Development Project Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
