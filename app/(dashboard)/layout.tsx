export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The sidebar and providers are already in the root layout
  // This layout just passes through
  return children
}
