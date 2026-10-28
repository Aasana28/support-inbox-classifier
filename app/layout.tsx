import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brightwave Support Inbox | AI Support Inbox Classifier & Draft Responder",
  description:
    "Classify incoming support/client emails by topic, urgency, and team; retrieve approved response guidance and draft a reply with human approval and escalation controls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
