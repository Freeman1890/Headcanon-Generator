import { Navigation } from "@/components/Navigation";

export default function FandomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
