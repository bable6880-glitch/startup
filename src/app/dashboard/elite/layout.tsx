// src/app/dashboard/elite/layout.tsx
// The Elite plan guard is handled client-side in page.tsx
// via the usePlanAccess() hook. Server components cannot read
// client Authorization headers in Next.js App Router.

export default function EliteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
