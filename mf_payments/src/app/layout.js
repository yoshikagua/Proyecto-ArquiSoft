import "./globals.css";

export const metadata = {
  title: "KuisiScore - Checkout Seguro",
  description: "Procesa pagos de forma rápida y segura",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
