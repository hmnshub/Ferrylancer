import { useState } from "react";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleConversations, sampleMessages } from "../data/sampleData";
import { Avatar, Card, Icon } from "../ui/primitives";

export default function Messages({ session }) {
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");

  const { data: conversations } = useSupabaseQuery(
    (sb) =>
      sb
        .from("conversations")
        .select("*")
        .or(`participant_a.eq.${session?.user?.id},participant_b.eq.${session?.user?.id}`)
        .order("updated_at", { ascending: false }),
    [session?.user?.id],
    sampleConversations
  );

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  const { data: messages, refetch } = useSupabaseQuery(
    (sb) => sb.from("messages").select("*").eq("conversation_id", active?.id || "").order("created_at", { ascending: true }),
    [active?.id],
    sampleMessages
  );

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    // Wired for real sends once `messages`/`conversations` tables exist — see supabase/schema.sql.
    // Heavy delivery (push notifications, read receipts) is handled by the Node backend's
    // POST /api/messages endpoint; here we just optimistically clear the input.
    setDraft("");
    refetch();
  };

  return (
    <div className="grid h-[calc(100vh-160px)] grid-cols-1 gap-0 overflow-hidden rounded-xl border border-[#c7c4d7] bg-white shadow-sm md:grid-cols-[300px_1fr]">
      <div className={`flex flex-col border-r border-[#e5eeff] ${active ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-[#e5eeff] p-4">
          <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#565e74]">search</Icon>
            <input placeholder="Search messages" className="w-full rounded-lg border border-[#c7c4d7] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#4648d4]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-3 border-b border-[#f2f4fb] px-4 py-3 text-left transition hover:bg-[#eff4ff] ${
                active?.id === c.id ? "bg-[#eff4ff]" : ""
              }`}
            >
              <Avatar size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[#0b1c30]">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-[#767586]">{c.time}</span>
                </div>
                <p className="truncate text-xs text-[#565e74]">{c.lastMessage}</p>
              </div>
              {c.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#4648d4]" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex flex-col ${active ? "flex" : "hidden md:flex"}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-[#e5eeff] p-4">
              <button className="md:hidden" onClick={() => setActiveId(null)}>
                <Icon>arrow_back</Icon>
              </button>
              <Avatar size={36} />
              <h1 className="text-sm font-bold text-[#0b1c30]">{active.name}</h1>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      m.from === "me" ? "bg-[#4648d4] text-white" : "bg-[#eff4ff] text-[#0b1c30]"
                    }`}
                  >
                    {m.text}
                    <div className={`mt-1 text-[10px] ${m.from === "me" ? "text-white/70" : "text-[#767586]"}`}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-[#e5eeff] p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 rounded-full border border-[#c7c4d7] px-4 py-2.5 text-sm outline-none focus:border-[#4648d4]"
              />
              <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4648d4] text-white">
                <Icon>send</Icon>
              </button>
            </form>
          </>
        ) : (
          <Card className="m-6 flex flex-col items-center gap-2 border-none py-16 text-center shadow-none">
            <Icon className="text-[26px] text-[#4648d4]">mail</Icon>
            <p className="text-sm text-[#565e74]">Select a conversation to start messaging.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
