import { useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Avatar, Card, Icon, PageHeader } from "../ui/primitives";

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function Network({ session, profile }) {
  const userId = session?.user?.id ?? "";

  // All connection rows where I am involved
  const { data: myConnections = [], refetch: refetchConnections } = useSupabaseQuery(
    (sb) =>
      userId
        ? sb
            .from("connections")
            .select("id, requester_id, recipient_id, status, created_at")
            .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        : Promise.resolve({ data: [], error: null }),
    [userId],
    []
  );

  // Pending INCOMING requests (other people sent to me)
  const pendingIncoming = myConnections.filter(
    (c) => c.recipient_id === userId && c.status === "pending"
  );

  // People I might know: everyone except me and people I already have a row with
  const connectedIds = new Set(
    myConnections.flatMap((c) => [c.requester_id, c.recipient_id])
  );

  const { data: allPeople = [], refetch: refetchPeople } = useSupabaseQuery(
    (sb) =>
      userId
        ? sb
            .from("profiles")
            .select("id, full_name, title, avatar_url, location, role")
            .neq("id", userId)
            .limit(50)
        : Promise.resolve({ data: [], error: null }),
    [userId],
    []
  );

  // 1. Pending incoming requester profiles
  const pendingRequesterIds = Array.from(new Set(pendingIncoming.map((c) => c.requester_id)));
  const { data: pendingRequesterProfiles = [] } = useSupabaseQuery(
    (sb) =>
      pendingRequesterIds.length > 0
        ? sb
            .from("profiles")
            .select("id, full_name, title, avatar_url, location, role")
            .in("id", pendingRequesterIds)
        : Promise.resolve({ data: [], error: null }),
    [pendingRequesterIds.join(",")],
    []
  );

  // 2. Accepted connections (my network)
  const acceptedConnections = myConnections.filter((c) => c.status === "accepted");
  const connectedPeerIds = new Set(
    acceptedConnections.flatMap((c) => [c.requester_id, c.recipient_id]).filter((id) => id !== userId)
  );
  const connectedPeerIdsArray = Array.from(connectedPeerIds);
  const { data: myNetwork = [] } = useSupabaseQuery(
    (sb) =>
      connectedPeerIdsArray.length > 0
        ? sb
            .from("profiles")
            .select("id, full_name, title, avatar_url, location, role")
            .in("id", connectedPeerIdsArray)
        : Promise.resolve({ data: [], error: null }),
    [connectedPeerIdsArray.join(",")],
    []
  );

  // Suggestions = people I don't have any connection row with yet
  const suggestions = allPeople.filter((p) => !connectedIds.has(p.id));

  const [tab, setTab] = useState("requests"); // "requests" | "suggestions" | "network"

  const counts = {
    requests: pendingIncoming.length,
    suggestions: suggestions.length,
    network: myNetwork.length,
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="My Network" />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-[#E4E6EB] bg-white p-1 shadow-sm">
        {[
          { key: "requests", label: "Pending Requests", icon: "pending" },
          { key: "suggestions", label: "People You May Know", icon: "people" },
          { key: "network", label: "My Connections", icon: "hub" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === t.key
                ? "bg-[#1877F2] text-white shadow"
                : "text-[#65676B] hover:bg-[#F0F2F5]"
            }`}
          >
            <Icon className="text-[18px]">{t.icon}</Icon>
            <span className="hidden sm:inline">{t.label}</span>
            {counts[t.key] > 0 && (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  tab === t.key ? "bg-white/25 text-white" : "bg-[#E7F3FF] text-[#1877F2]"
                }`}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Pending requests */}
      {tab === "requests" && (
        <PendingRequestsTab
          incoming={pendingIncoming}
          requesterProfiles={pendingRequesterProfiles}
          userId={userId}
          ownProfile={profile}
          onRefetch={() => { refetchConnections(); refetchPeople(); }}
        />
      )}

      {/* Tab: People you may know */}
      {tab === "suggestions" && (
        <SuggestionsTab
          suggestions={suggestions}
          userId={userId}
          ownProfile={profile}
          myConnections={myConnections}
          onRefetch={() => { refetchConnections(); refetchPeople(); }}
        />
      )}

      {/* Tab: My network */}
      {tab === "network" && (
        <NetworkTab
          people={myNetwork}
          userId={userId}
          myConnections={myConnections}
          onRefetch={() => { refetchConnections(); refetchPeople(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pending requests tab
// ─────────────────────────────────────────────────────────────────────────────
function PendingRequestsTab({ incoming, requesterProfiles, userId, ownProfile, onRefetch }) {
  if (incoming.length === 0) {
    return (
      <EmptyTab icon="pending_actions" text="No pending connection requests" />
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#65676B]">
        {incoming.length} pending {incoming.length === 1 ? "request" : "requests"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {incoming.map((conn) => {
          const person = requesterProfiles.find((p) => p.id === conn.requester_id);
          if (!person) return null;
          return (
            <IncomingRequestCard
              key={conn.id}
              connection={conn}
              person={person}
              userId={userId}
              ownProfile={ownProfile}
              onRefetch={onRefetch}
            />
          );
        })}
      </div>
    </div>
  );
}

function IncomingRequestCard({ connection, person, userId, ownProfile, onRefetch }) {
  const [loading, setLoading] = useState(null);

  const accept = async () => {
    setLoading("accept");
    const { data: updatedConnection, error: updateError } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connection.id)
      .select("id, status")
      .maybeSingle();

    if (updateError || !updatedConnection) {
      console.error("Could not accept connection request:", updateError);
      setLoading(null);
      window.alert("Could not accept this connection request. Please try again.");
      return;
    }

    // Notify the requester
    const myName = ownProfile?.full_name || "Someone";
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: connection.requester_id,
      type: "connection",
      text: `${myName} accepted your connection request. You are now connected!`,
      meta: { accepter_id: userId },
      unread: true,
    });
    if (notificationError) {
      console.error("Connection accepted, but notification could not be created:", notificationError);
    }
    setLoading(null);
    onRefetch();
  };

  const decline = async () => {
    setLoading("decline");
    await supabase.from("connections").delete().eq("id", connection.id);
    setLoading(null);
    onRefetch();
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <NavLink to={`/app/profile/${person.id}`}>
          <Avatar src={person.avatar_url} size={56} className="shrink-0 rounded-full border border-[#D8DADF]" />
        </NavLink>
        <div className="min-w-0 flex-1">
          <NavLink
            to={`/app/profile/${person.id}`}
            className="block truncate text-sm font-bold text-[#050505] hover:underline"
          >
            {person.full_name || "Unnamed user"}
          </NavLink>
          <p className="truncate text-xs text-[#65676B]">{person.title || person.role}</p>
          {person.location && (
            <p className="mt-0.5 flex items-center gap-0.5 truncate text-xs text-[#8A8D91]">
              <Icon className="text-[13px]">location_on</Icon>
              {person.location}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!!loading}
          onClick={accept}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1877F2] py-1.5 text-sm font-semibold text-white transition hover:bg-[#1465D8] disabled:opacity-60"
        >
          {loading === "accept" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Icon className="text-[16px]">person_add</Icon>
          )}
          Accept
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={decline}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#D8DADF] bg-white py-1.5 text-sm font-semibold text-[#050505] transition hover:bg-[#F0F2F5] disabled:opacity-60"
        >
          {loading === "decline" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#65676B] border-t-transparent" />
          ) : (
            <Icon className="text-[16px]">close</Icon>
          )}
          Ignore
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestions tab
// ─────────────────────────────────────────────────────────────────────────────
function SuggestionsTab({ suggestions, userId, ownProfile, myConnections, onRefetch }) {
  const [sentMap, setSentMap] = useState({}); // personId → "sending"|"pending"|"error"

  if (suggestions.length === 0) {
    return <EmptyTab icon="people" text="No more people to suggest right now" />;
  }

  const statusFor = (personId) => {
    if (sentMap[personId]) return sentMap[personId];
    const row = myConnections.find(
      (c) => c.requester_id === personId || c.recipient_id === personId
    );
    return row?.status ?? null;
  };

  const sendRequest = async (person) => {
    if (statusFor(person.id)) return;
    setSentMap((prev) => ({ ...prev, [person.id]: "sending" }));
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: userId, recipient_id: person.id, status: "pending" });
    if (!error) {
      const myName = ownProfile?.full_name || "Someone";
      await supabase.from("notifications").insert({
        user_id: person.id,
        type: "connection",
        text: `${myName} sent you a connection request.`,
        meta: { requester_id: userId },
        unread: true,
      });
    }
    setSentMap((prev) => ({ ...prev, [person.id]: error ? "error" : "pending" }));
    onRefetch();
  };

  const withdraw = async (person) => {
    setSentMap((prev) => ({ ...prev, [person.id]: "sending" }));
    const row = myConnections.find(
      (c) =>
        (c.requester_id === userId && c.recipient_id === person.id) ||
        (c.requester_id === person.id && c.recipient_id === userId)
    );
    if (row) {
      await supabase.from("connections").delete().eq("id", row.id);
    }
    setSentMap((prev) => {
      const next = { ...prev };
      delete next[person.id];
      return next;
    });
    onRefetch();
  };

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#65676B]">
        {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((person) => {
          const status = statusFor(person.id);
          return (
            <PersonCard
              key={person.id}
              person={person}
              status={status}
              onConnect={() => sendRequest(person)}
              onWithdraw={() => withdraw(person)}
            />
          );
        })}
      </div>
    </div>
  );
}

function PersonCard({ person, status, onConnect, onWithdraw }) {
  const isPending = status === "pending" || status === "sending";
  const isAccepted = status === "accepted";

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Mini cover banner */}
      <div className="h-14 bg-gradient-to-r from-[#1877F2]/30 to-[#E7F3FF]" />
      <div className="relative px-4 pb-4">
        <div className="absolute -top-8 left-4">
          <Avatar
            src={person.avatar_url}
            size={60}
            className="rounded-full border-4 border-white bg-[#D8DADF] shadow"
          />
        </div>
        <div className="pt-9">
          <NavLink
            to={`/app/profile/${person.id}`}
            className="block truncate text-sm font-bold text-[#050505] hover:underline"
          >
            {person.full_name || "Unnamed user"}
          </NavLink>
          <p className="truncate text-xs text-[#65676B]">{person.title || person.role}</p>
          {person.location && (
            <p className="mt-0.5 flex items-center gap-0.5 truncate text-xs text-[#8A8D91]">
              <Icon className="text-[13px]">location_on</Icon>
              {person.location}
            </p>
          )}
        </div>
        <div className="mt-3">
          {isAccepted ? (
            <div className="flex items-center justify-center gap-1 rounded-full border border-[#D8DADF] py-1.5 text-xs font-semibold text-[#65676B]">
              <Icon className="text-[15px] text-[#1877F2]">how_to_reg</Icon>
              Connected
            </div>
          ) : isPending ? (
            <button
              type="button"
              onClick={onWithdraw}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#1877F2] py-1.5 text-xs font-semibold text-[#1877F2] transition hover:bg-[#E7F3FF]"
            >
              <Icon className="text-[15px]">schedule</Icon>
              Pending · Withdraw
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1877F2] py-1.5 text-xs font-semibold text-white transition hover:bg-[#1465D8]"
            >
              <Icon className="text-[15px]">person_add</Icon>
              Connect
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My network tab
// ─────────────────────────────────────────────────────────────────────────────
function NetworkTab({ people, userId, myConnections, onRefetch }) {
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState(null);

  if (people.length === 0) {
    return (
      <EmptyTab
        icon="hub"
        text="You haven't connected with anyone yet"
        sub={'Go to "People You May Know" to start building your network'}
      />
    );
  }

  const filtered = people.filter(
    (p) =>
      !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const removeConnection = async (person) => {
    setRemoving(person.id);
    const row = myConnections.find(
      (c) =>
        (c.requester_id === userId && c.recipient_id === person.id) ||
        (c.requester_id === person.id && c.recipient_id === userId)
    );
    if (row) await supabase.from("connections").delete().eq("id", row.id);
    setRemoving(null);
    onRefetch();
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#65676B]">search</Icon>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your connections..."
            className="w-full rounded-full border border-[#D8DADF] bg-[#F0F2F5] py-2 pl-10 pr-4 text-sm text-[#050505] outline-none transition placeholder:text-[#65676B] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/20"
          />
        </div>
        <span className="shrink-0 text-sm font-semibold text-[#65676B]">
          {filtered.length} connection{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((person) => (
          <Card key={person.id} className="flex items-center gap-3 p-4">
            <NavLink to={`/app/profile/${person.id}`} className="shrink-0">
              <Avatar src={person.avatar_url} size={52} className="rounded-full border border-[#D8DADF]" />
            </NavLink>
            <div className="min-w-0 flex-1">
              <NavLink
                to={`/app/profile/${person.id}`}
                className="block truncate text-sm font-bold text-[#050505] hover:underline"
              >
                {person.full_name || "Unnamed user"}
              </NavLink>
              <p className="truncate text-xs text-[#65676B]">{person.title || person.role}</p>
            </div>
            <button
              type="button"
              title="Remove connection"
              disabled={removing === person.id}
              onClick={() => removeConnection(person)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#65676B] transition hover:bg-[#F0F2F5] hover:text-[#ba1a1a] disabled:opacity-40"
            >
              {removing === person.id ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#65676B] border-t-transparent" />
              ) : (
                <Icon className="text-[18px]">person_remove</Icon>
              )}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function EmptyTab({ icon, text, sub }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#E4E6EB] bg-white px-6 py-16 text-center">
      <Icon className="text-[52px] text-[#D8DADF]">{icon}</Icon>
      <p className="text-sm font-semibold text-[#050505]">{text}</p>
      {sub && <p className="text-xs text-[#65676B]">{sub}</p>}
    </div>
  );
}
