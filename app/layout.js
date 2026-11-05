import "./globals.css";

export const metadata = {
  title: "Calculator",
  description: "Hamid Ali and Syed Haider",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
