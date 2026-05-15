import Reports from "@/app/(routes)/administration/reports/Reports";
import { getContacts } from "@/app/lib/services/admin/reports/bugsAndFeedbacks";

export const dynamic = "force-dynamic";

const MessagesSlot = async () => {
  let contacts = [];
  try {
    contacts = await getContacts();
  } catch (e) {
    console.error("[MessagesSlot]", e);
  }
  return <Reports data={contacts} type="contact" />;
};

export default MessagesSlot;
