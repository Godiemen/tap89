import './globals.css';
import Shell from './Shell';

export const metadata = {
  title: 'SipDash Admin',
  description: 'Platform administration.',
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
