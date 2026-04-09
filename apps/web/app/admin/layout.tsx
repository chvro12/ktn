import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}
