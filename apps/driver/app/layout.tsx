import './globals.css';
import Shell from './Shell';

export const metadata = {
  title: 'SipDash Drive — Courier',
  description: 'Deliver alcohol, earn on your schedule. ID checks on every drop-off.',
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
