import { useEffect, useMemo, useState } from "react";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { supabase } from "../../lib/supabaseClient";
import { Avatar, Card, Icon } from "../ui/primitives";

export default function Messages({ session }) {
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  const { data: conversations = [], refetch: refetchConversations } = useSupabaseQuery(
    (sb) =>
      sb
        .from("conversations")
        .select("*")
        .or(`participant_a.eq.${session?.user?.id},participant_b.eq.${session?.user?.id}`)
        .order("updated_at", { ascending: false }),
    [session?.user?.id],
    []
  );

  const { data: unreadMessageNotifications = [], refetch: refetchUnreadMessages } = useSupabaseQuery(
    (sb) => sb
      .from("notifications")
      .select("id, meta")
      .eq("user_id", session?.user?.id || "")
      .eq("type", "message")
      .eq("unread", true),
    [session?.user?.id],
    []
  );

  const unreadByConversation = useMemo(() => unreadMessageNotifications.reduce((counts, notification) => {
    const conversationId = notification.meta?.conversation_id;
    if (conversationId) counts[conversationId] = (counts[conversationId] || 0) + 1;
    return counts;
  }, {}), [unreadMessageNotifications]);

  const participantIds = useMemo(() => [...new Set(conversations.flatMap((conversation) => [conversation.participant_a, conversation.participant_b]).filter((id) => id && id !== session?.user?.id))], [conversations, session?.user?.id]);
  const { data: participants = [] } = useSupabaseQuery(
    (sb) => sb.from("profiles").select("id, full_name, company_name, title, avatar_url").in("id", participantIds.length ? participantIds : ["00000000-0000-0000-0000-000000000000"]),
    [participantIds.join(",")],
    []
  );

  const personFor = (conversation) => participants.find((person) => person.id === (conversation.participant_a === session?.user?.id ? conversation.participant_b : conversation.participant_a));

  const active = conversations.find((c) => c.id === activeId) || (isDesktop ? conversations[0] : null);

  const { data: messages = [], refetch } = useSupabaseQuery(
    (sb) => sb.from("messages").select("*").eq("conversation_id", active?.id || "").order("created_at", { ascending: true }),
    [active?.id],
    []
  );

  useEffect(() => {
    if (!active?.id || !session?.user?.id || !supabase) return;
    supabase
      .from("notifications")
      .update({ unread: false })
      .eq("user_id", session.user.id)
      .eq("type", "message")
      .eq("unread", true)
      .contains("meta", { conversation_id: active.id })
      .then(() => refetchUnreadMessages());
    // The query hook returns a new refetch function on each render; this effect
    // intentionally depends only on the selected conversation and user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, session?.user?.id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    if (!supabase || !session?.user?.id || !active?.id) return;
    const { error } = await supabase.from("messages").insert({ conversation_id: active.id, sender_id: session.user.id, text: draft.trim() });
    if (error) {
      console.error(error);
      return;
    }
    const recipientId = active.participant_a === session.user.id ? active.participant_b : active.participant_a;
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", active.id);
    if (recipientId && recipientId !== session.user.id) {
      const senderName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Someone";
      await supabase.from("notifications").insert({
        user_id: recipientId,
        type: "message",
        text: `${senderName} sent you a message.`,
        meta: { conversation_id: active.id, sender_id: session.user.id },
        unread: true,
      });
    }
    setDraft("");
    refetch();
    refetchConversations();
  };

  return (
    <div className="grid h-[calc(100vh-160px)] grid-cols-1 gap-0 overflow-hidden rounded-xl border border-[#D8DADF] bg-white shadow-sm md:grid-cols-[300px_1fr]">
      <div className={`flex flex-col border-r border-[#E4E6EB] ${active ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-[#E4E6EB] p-4">
          <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#65676B]">search</Icon>
            <input placeholder="Search messages" className="w-full rounded-lg border border-[#D8DADF] bg-[#F0F2F5] py-2 pl-9 pr-3 text-sm text-[#050505] outline-none focus:border-[#1877F2] focus:bg-white" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-3 border-b border-[#F0F2F5] px-4 py-3 text-left transition hover:bg-[#F0F2F5] ${
                active?.id === c.id ? "bg-[#E7F3FF]" : ""
              }`}
            >
              <Avatar src={personFor(c)?.avatar_url} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[#050505]">{personFor(c)?.company_name || personFor(c)?.full_name || "Ferrylance member"}</span>
                  <span className="shrink-0 text-[11px] text-[#8A8D91]">{new Date(c.updated_at).toLocaleDateString()}</span>
                </div>
                <p className="truncate text-xs text-[#65676B]">{personFor(c)?.title || "Active conversation"}</p>
              </div>
              {(unreadByConversation[c.id] || 0) > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1877F2] px-1 text-[10px] font-bold text-white">
                  {unreadByConversation[c.id]}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex flex-col ${active ? "flex" : "hidden md:flex"}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-[#E4E6EB] p-4">
              <button className="md:hidden text-[#65676B] hover:text-[#050505]" onClick={() => setActiveId(null)}>
                <Icon>arrow_back</Icon>
              </button>
              <Avatar src={personFor(active)?.avatar_url} size={36} />
              <h1 className="text-sm font-bold text-[#050505]">{personFor(active)?.company_name || personFor(active)?.full_name || "Ferrylance member"}</h1>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-[#F0F2F5]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === session?.user?.id ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      m.sender_id === session?.user?.id ? "bg-[#1877F2] text-white" : "bg-white text-[#050505] border border-[#D8DADF]"
                    }`}
                  >
                    {m.text}
                    <div className={`mt-1 text-[10px] ${m.sender_id === session?.user?.id ? "text-white/80" : "text-[#8A8D91]"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-[#E4E6EB] p-3 bg-white">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 rounded-full border border-[#D8DADF] bg-[#F0F2F5] px-4 py-2.5 text-sm text-[#050505] outline-none focus:border-[#1877F2] focus:bg-white"
              />
              <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white hover:bg-[#1465D8] transition shadow-sm">
                <Icon>send</Icon>
              </button>
            </form>
          </>
        ) : (
          <Card className="m-6 flex flex-col items-center gap-2 border-none py-16 text-center shadow-none">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
              <Icon className="text-[26px]">mail</Icon>
            </div>
            <p className="text-sm text-[#65676B]">Select a conversation to start messaging.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
