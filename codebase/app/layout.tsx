import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freehand Slide Lab",
  description: "MVP khoanh vùng tự do trên slide PDF và xem trước vùng đã chọn.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
