import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/ui-bits";
import { CustomersTable } from "@/components/shared/customers-table";
import { requireViewer } from "@/lib/auth/viewer";
import { listCustomers, listReps } from "@/lib/data";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  await requireViewer(["admin"], "/admin/customers");
  const [customers, reps] = await Promise.all([listCustomers(), listReps()]);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Customers" title="All customers" description={`${customers.length} customers across every stage. Assign, reassign or open any record.`} />
      <CustomersTable rows={customers} admin reps={reps.filter((r) => r.status === "active").map((r) => ({ id: r.id, name: r.name, open: r.open }))} />
    </div>
  );
}
