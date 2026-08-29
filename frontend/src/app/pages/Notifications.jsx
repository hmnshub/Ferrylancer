import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { supabase } from "../../lib/supabaseClient";
import { Avatar, Card, Icon, PageHeader, SecondaryButton } from "../ui/primitives";


const TYPE_ICON = {
  proposal: "send",
  message: "mail",
  connection: "person_add",
  payment: "payments",
};

export default function Notifications({ session }) {
  const { data: notifications = [], refetch } = useSupabaseQuery(
    (sb) => sb.from("notifications").select("*").eq("user_id", session?.user?.id || "").order("created_at", { ascending: false }),
    [session?.user?.id],
    []
  );

  const markAllRead = async () => {
    const { error } = await supabase.from("notifications").update({ unread: false }).eq("user_id", session?.user?.id || "").eq("unread", true);
    if (error) console.error(error);
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

      <Card className="divide-y divide-[#E4E6EB] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Icon className="text-[48px] text-[#D8DADF]">notifications_none</Icon>
            <p className="text-sm text-[#65676B]">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              currentUserId={session?.user?.id}
              onRefetch={refetch}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function NotificationRow({ notification: n, currentUserId, onRefetch }) {
  const [loading, setLoading] = useState(null); // "accept" | "decline"

  // Show Accept/Ignore only for connection notifications that haven't been acted on yet
  const isConnectionRequest =
    n.type === "connection" && n.meta?.requester_id && !n.meta?.accepter_id;

  const acceptConnection = async () => {
    setLoading("accept");
    const { data: conn } = await supabase
      .from("connections")
      .select("id, requester_id")
      .eq("requester_id", n.meta.requester_id)
      .eq("recipient_id", currentUserId)
      .eq("status", "pending")
      .maybeSingle();

    if (conn) {
      await supabase.from("connections").update({ status: "accepted" }).eq("id", conn.id);
      // Notify the requester
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .maybeSingle();
      await supabase.from("notifications").insert({
        user_id: conn.requester_id,
        type: "connection",
        text: `${myProfile?.full_name || "Someone"} accepted your connection request. You are now connected!`,
        meta: { accepter_id: currentUserId },
        unread: true,
      });
    }
    await supabase.from("notifications").update({ unread: false, meta: { ...n.meta, accepter_id: currentUserId } }).eq("id", n.id);
    setLoading(null);
    onRefetch();
  };

  const declineConnection = async () => {
    setLoading("decline");
    await supabase
      .from("connections")
      .delete()
      .eq("requester_id", n.meta.requester_id)
      .eq("recipient_id", currentUserId)
      .eq("status", "pending");
    await supabase.from("notifications").update({ unread: false, meta: { ...n.meta, declined: true } }).eq("id", n.id);
    setLoading(null);
    onRefetch();
  };

  return (
    <div className={`flex items-start gap-3 p-4 ${n.unread ? "bg-[#E7F3FF]/50" : ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
        <Icon className="text-[18px]">{TYPE_ICON[n.type] || "notifications"}</Icon>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#050505]">
          {n.meta?.requester_id ? (
            <>
              <NavLink
                to={`/app/profile/${n.meta.requester_id}`}
                className="font-semibold text-[#1877F2] hover:underline"
              >
                {n.text.split(" ")[0]}
              </NavLink>{" "}
              {n.text.split(" ").slice(1).join(" ")}
            </>
          ) : (
            n.text
          )}
        </p>
        <p className="mt-0.5 text-xs text-[#8A8D91]">{timeAgo(n.created_at)}</p>

        {isConnectionRequest && (
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={!!loading}
              onClick={acceptConnection}
              className="flex items-center gap-1.5 rounded-full bg-[#1877F2] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1465D8] disabled:opacity-60"
            >
              {loading === "accept" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Icon className="text-[14px]">person_add</Icon>
              )}
              Accept
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={declineConnection}
              className="flex items-center gap-1.5 rounded-full border border-[#D8DADF] bg-white px-4 py-1.5 text-xs font-semibold text-[#050505] transition hover:bg-[#F0F2F5] disabled:opacity-60"
            >
              {loading === "decline" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#65676B] border-t-transparent" />
              ) : (
                <Icon className="text-[14px]">close</Icon>
              )}
              Ignore
            </button>
          </div>
        )}
      </div>
      {n.unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1877F2]" /> : null}
    </div>
  );
}

function timeAgo(value) {
  if (!value) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;
}

