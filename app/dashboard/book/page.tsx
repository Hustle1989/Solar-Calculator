import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/ui-bits";
import { BookingPicker } from "@/components/booking/booking-picker";
import { DEMO_CUSTOMER_ID, getCustomer, getRep } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Book a call" };

export default function BookPage() {
  const me = getCustomer(DEMO_CUSTOMER_ID)!;
  const rep = getRep(me.repId)!;
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Book a call"
        title={`Video call with ${rep.name.split(" ")[0]}`}
        description="Pick a time that suits you. You'll get a confirmation email and reminders, and you can join right from your dashboard."
      />
      <BookingPicker customerId={me.id} rep={{ id: rep.id, name: rep.name, title: rep.title, online: rep.online }} />
    </div>
  );
}
