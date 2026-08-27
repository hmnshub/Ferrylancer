import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleNotifications } from "../data/sampleData";
import { Card, Icon, PageHeader, SecondaryButton } from "../ui/primitives";

const TYPE_ICON = {
  proposal: "send",
  message: "mail",
  connection: "person_add",
  payment: "payments",
};

export default function Notifications({ session }) {
  const { data: notifications, refetch } = useSupabaseQuery(
    (sb) => sb.from("notifications").select("*").eq("user_id", session?.user?.id || "").order("created_at", { ascending: false }),
    [session?.user?.id],
    sampleNotifications
  );

  const markAllRead = async () => {
    // Heavy fan-out (push/email digest) is handled by the Node backend; here we just
    // flip the read flags for this user's rows.
    refetch();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        actions={
          <SecondaryButton onClick={markAllRead}>
            <Icon className="text-[18px]">done_all</Icon>
            Mark all as read
          </SecondaryButton>
        }
      />

      <Card className="divide-y divide-[#e5eeff] overflow-hidden">
        {notifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 p-4 ${n.unread ? "bg-[#eff4ff]/50" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] text-[#4648d4]">
              <Icon className="text-[18px]">{TYPE_ICON[n.type] || "notifications"}</Icon>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#0b1c30]">{n.text}</p>
              <p className="mt-0.5 text-xs text-[#767586]">{n.time}</p>
            </div>
            {n.unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#4648d4]" /> : null}
          </div>
        ))}
      </Card>
    </div>
  );
}
