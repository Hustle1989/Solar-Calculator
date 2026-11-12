import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/ui-bits";
import { CustomersTable } from "@/components/shared/customers-table";
import { customers } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Customers" };

export default function AdminCustomersPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Customers"
        title="All customers"
        description={`${customers.length} customers across every stage. Assign, reassign or open any record.`}
        actions={
          <Button variant="outline">
            <DownloadIcon /> Export CSV
          </Button>
        }
      />
      <CustomersTable rows={customers} admin />
    </div>
  );
}
