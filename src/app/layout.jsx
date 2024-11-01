// src/app/layout.jsx
import "../styles/globals.css";

export const metadata = {
  title: "Dashboard",
  description: "Admin and User Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
