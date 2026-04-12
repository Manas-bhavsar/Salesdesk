import type { Metadata } from "next";
import "./globals.css";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export const metadata: Metadata = {
  title: "SalesDesk",
  description: "Complete offline desktop sales tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
                  var theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
