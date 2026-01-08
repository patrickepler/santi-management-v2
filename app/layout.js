import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: 'Santi Management V2',
  description: 'Sustainable Development Project Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
