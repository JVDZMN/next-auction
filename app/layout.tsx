import { Geist } from "next/font/google";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// Root layout — html/body and providers are owned by app/[locale]/layout.tsx.
// This file must exist for Next.js but is otherwise a transparent passthrough.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement
}
