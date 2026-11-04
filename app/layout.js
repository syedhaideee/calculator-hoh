import "./globals.css";

export const metadata = {
  title: "Profit Sharing Calculator · House of Horticulturists",
  description: "Profit sharing between Hamid Ali and Syed Haider",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
