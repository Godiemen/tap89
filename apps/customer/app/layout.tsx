import './globals.css';
import Shell from './Shell';

export const metadata = {
  title: 'SipDash — Tonight, delivered',
  description: 'Alcohol delivery from local bottle shops in 30 minutes. 21+ only.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
