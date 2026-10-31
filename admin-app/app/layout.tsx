import type { Metadata } from "next";
import "./admin/admin.css";
export const metadata: Metadata = {
  title: {
    default: "Modi Holidays Operations",
    template: "%s | Modi Holidays",
  },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
