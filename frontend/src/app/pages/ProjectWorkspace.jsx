import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { compressImage } from "../../lib/imageCompressor";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

const TABS = ["Overview", "Tasks", "Milestones", "Files", "Payments"];

export default function ProjectWorkspace({ session }) {
  const { id } = useParams();
  const [tab, setTab] = useState("Overview");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);
  const { data: project } = useSupabaseQuery((sb) => sb.from("projects").select("*").eq("id", id).maybeSingle(), [id], null);
  const { data: milestones = [], refetch: refetchMilestones } = useSupabaseQuery((sb) => sb.from("milestones").select("*").eq("project_id", id).order("due", { ascending: true }), [id], []);
  const { data: tasks = [], refetch: refetchTasks } = useSupabaseQuery((sb) => sb.from("project_tasks").select("*").eq("project_id", id).order("due", { ascending: true }), [id], []);
  const { data: files = [], refetch: refetchFiles } = useSupabaseQuery(async (sb) => {
    const result = await sb.from("project_files").select("*").eq("project_id", id).order("created_at", { ascending: false });
    if (result.error) return result;
    const data = await Promise.all((result.data || []).map(async (file) => {
      const signed = await sb.storage.from("project-files").createSignedUrl(file.path, 3600);
      return { ...file, url: signed.data?.signedUrl || "" };
    }));
    return { data, error: null };
  }, [id], []);
  const { data: payments = [], refetch: refetchPayments } = useSupabaseQuery((sb) => sb.from("project_payments").select("*").eq("project_id", id).order("sent_at", { ascending: false }), [id], []);

  if (!project) return null;
  const isClient = session?.user?.id === project.client_id;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const completedMilestones = milestones.filter((milestone) => milestone.status === "done").length;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : milestones.length ? Math.round((completedMilestones / milestones.length) * 100) : 0;
  const activeMilestone = milestones.find((milestone) => milestone.status === "in_progress");

  const createTask = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from("project_tasks").insert({ project_id: id, title: form.get("title"), status: form.get("status"), due: form.get("due") || null });
    if (insertError) setError(insertError.message); else { setModal(null); await refetchTasks(); }
    setSaving(false);
  };

  const createMilestone = async (event) => {
    event.preventDefault();
    setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error: insertError } = await supabase.from("milestones").insert({ project_id: id, title: form.get("title"), status: isClient ? form.get("status") : "upcoming", due: form.get("due") || null, amount: form.get("amount") || null, proposed_by: session.user.id, approval_status: isClient ? "approved" : "pending" });
    if (insertError) setError(insertError.message); else { setModal(null); await refetchMilestones(); }
    setSaving(false);
  };

  const uploadFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    setSaving(true); setError("");
    try {
      for (const file of selected) {
        const uploadFile = file.type.startsWith("image/") ? await compressImage(file, 1600, 0.78, 350 * 1024) : file;
        const path = `${id}/${session.user.id}/${Date.now()}-${uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const upload = await supabase.storage.from("project-files").upload(path, uploadFile, { contentType: uploadFile.type || "application/octet-stream", upsert: false });
        if (upload.error) throw upload.error;
        const record = await supabase.from("project_files").insert({ project_id: id, uploaded_by: session.user.id, name: file.name, path, size_bytes: uploadFile.size });
        if (record.error) throw record.error;
      }
      await refetchFiles();
      setTab("Files");
    } catch (uploadError) { setError(uploadError.message || "Unable to upload file."); }
    event.target.value = "";
    setSaving(false);
  };

  return <div>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><div className="mb-1 flex items-center gap-2 text-xs text-[#65676B]">Client project <Badge tone="primary">{project.status}</Badge></div><h1 className="text-2xl font-bold text-[#050505] md:text-[32px]">{project.title}</h1></div><SecondaryButton><Icon className="text-[18px]">edit</Icon>Edit Details</SecondaryButton></div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D8DADF] bg-white p-1"><div className="flex gap-1 overflow-x-auto">{TABS.map((item) => <button key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${tab === item ? "bg-[#1877F2] text-white" : "text-[#65676B] hover:bg-[#F0F2F5]"}`}>{item}</button>)}</div><div className="flex gap-1 px-1">{isClient ? <PrimaryButton className="px-3 py-2 text-xs" onClick={() => setModal("task")}><Icon className="text-[16px]">add_task</Icon>Task</PrimaryButton> : null}<PrimaryButton className="px-3 py-2 text-xs" onClick={() => setModal("milestone")}><Icon className="text-[16px]">flag</Icon>{isClient ? "Milestone" : "Propose Milestone"}</PrimaryButton><SecondaryButton className="px-3 py-2 text-xs" onClick={() => fileInput.current?.click()} disabled={saving}><Icon className="text-[16px]">upload_file</Icon>File</SecondaryButton><input ref={fileInput} type="file" multiple className="hidden" onChange={uploadFiles} /></div></div>
    {error ? <p className="mb-4 rounded-lg border border-[#f3b5b5] bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#ba1a1a]">{error}</p> : null}
    {tab === "Overview" && activeMilestone ? <PaymentNotice milestone={activeMilestone} isClient={isClient} /> : null}
    {tab === "Overview" ? <Overview project={project} tasks={tasks} activeMilestone={activeMilestone} progress={progress} payments={payments} isClient={isClient} onTasks={() => setTab("Tasks")} /> : tab === "Tasks" ? <TaskList tasks={tasks} /> : tab === "Milestones" ? <MilestoneList milestones={milestones} project={project} session={session} isClient={isClient} refetch={refetchMilestones} refetchPayments={refetchPayments} /> : tab === "Files" ? <FileList files={files} /> : <PaymentList payments={payments} isClient={isClient} />}
    {modal === "task" ? <Modal title="Create task" onClose={() => setModal(null)}><form onSubmit={createTask} className="space-y-4"><Field name="title" label="What needs to be done?" placeholder="e.g. Prepare homepage design" required /><div className="grid grid-cols-2 gap-3"><Field name="due" label="Due date" type="date" /><Select name="status" label="Status" options={[["todo", "To do"], ["in_progress", "In progress"], ["completed", "Completed"]]} /></div><PrimaryButton type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Create task"}</PrimaryButton></form></Modal> : null}
    {modal === "milestone" ? <Modal title={isClient ? "Create milestone" : "Propose milestone"} onClose={() => setModal(null)}><form onSubmit={createMilestone} className="space-y-4"><Field name="title" label="Milestone name" placeholder="e.g. Website design approved" required /><div className="grid grid-cols-2 gap-3"><Field name="due" label="Due date" type="date" /><Field name="amount" label="Payment amount" placeholder="e.g. NPR 10000" /></div>{isClient ? <Select name="status" label="Status" options={[["upcoming", "Upcoming"], ["in_progress", "In progress"], ["done", "Done"]]} /> : <p className="rounded-lg bg-[#E7F3FF] px-3 py-2 text-xs text-[#36506f]">The client will review this proposed milestone before approving it.</p>}<PrimaryButton type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : isClient ? "Create milestone" : "Propose milestone"}</PrimaryButton></form></Modal> : null}
  </div>;
}

function Overview({ project, tasks, activeMilestone, progress, onTasks }) { return <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-6"><div className="grid grid-cols-3 gap-3"><Stat label="Total Progress" value={`${progress}%`} /><Stat label="Time Logged" value={`${Number(project.time_logged_hours || 0)}h`} /><Stat label="Deadline" value={project.deadline || "Not set"} /></div><Card className="p-6">{activeMilestone ? <><div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#1877F2]">Current Milestone · Active</div><h3 className="mb-1 text-lg font-bold text-[#050505]">{activeMilestone.title}</h3><p className="text-sm text-[#65676B]">Due {activeMilestone.due || "No date set"}{activeMilestone.amount ? ` · ${activeMilestone.amount}` : ""}</p></> : <EmptyInline icon="flag" text="No active milestone has been added yet." />}</Card><Card className="p-6"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-bold text-[#050505]">Recent Tasks</h3>{tasks.length ? <button onClick={onTasks} className="text-xs font-semibold text-[#1877F2]">View All</button> : null}</div>{tasks.length ? <div className="space-y-3">{tasks.slice(0, 3).map((task) => <TaskRow key={task.id} task={task} />)}</div> : <EmptyInline icon="checklist" text="No tasks have been added to this project yet." />}</Card></div><Card className="h-fit p-6"><h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#050505]"><Icon className="text-[#1877F2]">account_balance</Icon>Budget Summary</h3><div className="text-2xl font-bold text-[#050505]">{project.budget || "Not set"}</div><div className="text-xs text-[#65676B]">Total Budget</div></Card></div>; }
function TaskList({ tasks }) { return tasks.length ? <div className="space-y-3">{tasks.map((task) => <Card key={task.id} className="p-4"><TaskRow task={task} /></Card>)}</div> : <EmptyTab title="Tasks" />; }
function MilestoneList({ milestones, project, session, isClient, refetch, refetchPayments }) {
  const [selectedId, setSelectedId] = useState(null);
  const [actionError, setActionError] = useState("");
  const updatePayment = async (milestone, paymentStatus, status = milestone.status) => {
    setActionError("");
    if (paymentStatus === "paid") {
      const payment = await supabase.from("project_payments").insert({ project_id: project.id, milestone_id: milestone.id, amount: milestone.amount, status: "sent", sent_by: session.user.id, received_by: project.hired_freelancer_id }).select("id").single();
      if (payment.error) return setActionError(payment.error.message);
      const notification = await supabase.from("notifications").insert({ user_id: project.hired_freelancer_id, type: "payment", text: `Payment of ${milestone.amount} was sent for milestone: ${milestone.title}. Please confirm receipt.`, meta: { project_id: project.id, milestone_id: milestone.id, payment_id: payment.data.id }, unread: true });
      if (notification.error) console.warn("Payment notification failed:", notification.error.message);
    } else {
      const payment = await supabase.from("project_payments").update({ status: "received", received_by: session.user.id, received_at: new Date().toISOString() }).eq("milestone_id", milestone.id).eq("status", "sent");
      if (payment.error) return setActionError(payment.error.message);
      const notification = await supabase.from("notifications").insert({ user_id: project.client_id, type: "payment", text: `Payment of ${milestone.amount} was confirmed as received for milestone: ${milestone.title}.`, meta: { project_id: project.id, milestone_id: milestone.id }, unread: true });
      if (notification.error) console.warn("Payment notification failed:", notification.error.message);
    }
    const { error } = await supabase.from("milestones").update({ payment_status: paymentStatus, status }).eq("id", milestone.id);
    if (error) setActionError(error.message); else { setSelectedId(null); await refetch(); await refetchPayments(); }
  };
  if (!milestones.length) return <EmptyTab title="Milestones" />;
  return <div className="space-y-3">{actionError ? <p className="rounded-lg border border-[#f3b5b5] bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#ba1a1a]">{actionError}</p> : null}{milestones.map((milestone) => {
    const isPaid = milestone.payment_status === "paid";
    const isConfirmed = milestone.payment_status === "confirmed" || milestone.status === "done";
    const canPay = isClient && !isPaid && !isConfirmed && milestone.amount && milestone.approval_status !== "pending";
    const canConfirm = !isClient && isPaid && session?.user?.id;
    return <Card key={milestone.id} className="p-4"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><button type="button" onClick={() => setSelectedId(selectedId === milestone.id ? null : milestone.id)} className="rounded-full" aria-label={`Payment actions for ${milestone.title}`}><Icon filled={isConfirmed} className={isConfirmed ? "text-[#0f7a44]" : isPaid ? "text-[#d89b00]" : milestone.status === "in_progress" ? "text-[#1877F2]" : "text-[#D8DADF]"}>{isConfirmed ? "check_circle" : isPaid ? "check_circle" : "radio_button_unchecked"}</Icon></button><div><div className="text-sm font-semibold text-[#050505]">{milestone.title}</div><div className="text-xs text-[#65676B]">Due {milestone.due || "No date set"}</div>{milestone.approval_status === "pending" ? <div className="mt-1 text-xs font-semibold text-[#8a5a00]">Awaiting client approval</div> : null}</div></div><div className="text-right"><div className="text-sm font-bold text-[#050505]">{milestone.amount || "Amount not set"}</div><div className="mb-1 text-[11px] text-[#65676B]">Payment for this milestone</div><Badge tone={milestone.approval_status === "pending" ? "warning" : isConfirmed ? "success" : isPaid ? "warning" : milestone.status === "in_progress" ? "primary" : "neutral"}>{milestone.approval_status === "pending" ? "Proposed" : isConfirmed ? (isClient ? "Payment sent" : "Payment received") : isPaid ? (isClient ? "Payment verification pending" : "Confirm payment received") : milestone.status.replace("_", " ")}</Badge></div></div>{selectedId === milestone.id || (!isClient && isPaid) ? <div className="mt-3 rounded-xl border border-[#E4E6EB] bg-[#F7F8FA] p-3">{canPay ? <button type="button" onClick={() => updatePayment(milestone, "paid")} className="rounded-lg bg-[#d89b00] px-3 py-2 text-sm font-bold text-white hover:bg-[#b98100]">Release payment · {milestone.amount}</button> : canConfirm ? <button type="button" onClick={() => updatePayment(milestone, "confirmed", "done")} className="rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-bold text-white hover:bg-[#1465D8]">Confirm payment received</button> : isPaid ? <p className="text-sm font-semibold text-[#8a5a00]">{isClient ? "Payment verification pending." : "Please confirm that you received this payment."}</p> : isConfirmed ? <p className="text-sm font-semibold text-[#0f7a44]">{isClient ? "Payment sent." : "Payment received. Milestone completed."}</p> : <p className="text-sm text-[#65676B]">The payment action will be available after this milestone is approved.</p>}</div> : null}</Card>;
  })}</div>;
}
function PaymentNotice({ milestone, isClient }) { if (milestone.payment_status === "paid") return <Card className="mb-4 border-[#f1d48b] bg-[#fff9e9] p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#8a5a00]"><Icon>hourglass_top</Icon>{isClient ? "Payment verification pending" : "Payment received confirmation required"}</div><p className="mt-1 text-xs text-[#8a5a00]">{isClient ? `The freelancer must confirm receipt of ${milestone.amount || "the milestone payment"}.` : `Please confirm receipt of ${milestone.amount || "this milestone payment"} in the Milestones tab.`}</p></Card>; if (milestone.payment_status === "confirmed") return <Card className="mb-4 border-[#b8e1c8] bg-[#effaf2] p-4"><div className="flex items-center gap-2 text-sm font-bold text-[#0f7a44]"><Icon>check_circle</Icon>{isClient ? "Payment sent" : "Payment received"}</div><p className="mt-1 text-xs text-[#0f7a44]">{milestone.amount || "Milestone payment"} confirmed and recorded.</p></Card>; return null; }
function PaymentList({ payments, isClient }) { return payments.length ? <div className="space-y-3">{payments.map((payment) => <Card key={payment.id} className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><Icon className={payment.status === "received" ? "text-[#0f7a44]" : "text-[#d89b00]"}>{payment.status === "received" ? "check_circle" : "hourglass_top"}</Icon><div><div className="text-sm font-semibold text-[#050505]">Milestone payment</div><div className="text-xs text-[#65676B]">{new Date(payment.sent_at).toLocaleDateString()} · {payment.status === "received" ? (isClient ? "Payment sent" : "Payment received") : "Payment verification pending"}</div></div></div><strong className={payment.status === "received" ? "text-[#0f7a44]" : "text-[#8a5a00]"}>{payment.amount}</strong></Card>)}</div> : <EmptyTab title="Payments" message="No milestone payments have been recorded yet." />; }
function FileList({ files }) { return files.length ? <div className="grid gap-3 sm:grid-cols-2">{files.map((file) => <a key={file.id} href={file.url || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[#D8DADF] bg-white p-4 transition hover:border-[#1877F2] hover:bg-[#F7FBFF]"><Icon className="text-2xl text-[#1877F2]">description</Icon><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#050505]">{file.name}</span><span className="text-xs text-[#65676B]">{file.size_bytes ? `${Math.ceil(file.size_bytes / 1024)} KB` : "Project file"}</span></span></a>)}</div> : <EmptyTab title="Files" />; }
function TaskRow({ task }) { const tone = task.status === "completed" ? "success" : task.status === "in_progress" ? "primary" : "neutral"; return <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E4E6EB] p-3"><div><div className="text-sm font-semibold text-[#050505]">{task.title}</div><div className="text-xs text-[#65676B]">{task.assignee_id ? "Assigned freelancer" : "Unassigned"}</div></div><div className="flex items-center gap-3"><Badge tone={tone}>{task.status.replace("_", " ")}</Badge><span className="text-xs text-[#65676B]">{task.due || "No date"}</span></div></div>; }
function EmptyTab({ title, message }) { return <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]"><Icon className="text-[26px]">inbox</Icon></div><div className="text-sm font-semibold text-[#050505]">{message || `No ${title.toLowerCase()} have been added to this project yet.`}</div></Card>; }
function EmptyInline({ icon, text }) { return <div className="flex items-center gap-2 text-sm text-[#65676B]"><Icon className="text-[#8A8D91]">{icon}</Icon>{text}</div>; }
function Stat({ label, value }) { return <div className="rounded-xl border border-[#D8DADF] bg-white p-4 text-center"><div className="text-xl font-bold text-[#050505]">{value}</div><div className="text-xs text-[#65676B]">{label}</div></div>; }
function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213d]/30 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-white/80 bg-white/95 p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-[#050505]">{title}</h2><button type="button" onClick={onClose} className="rounded-full p-1 text-[#65676B] hover:bg-[#F0F2F5]"><Icon>close</Icon></button></div>{children}</div></div>; }
function Field({ label, name, type = "text", placeholder, required = false }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#050505]">{label}</span><input name={name} type={type} placeholder={placeholder} required={required} className="w-full rounded-lg border border-[#D8DADF] px-3 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20" /></label>; }
function Select({ label, name, options }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#050505]">{label}</span><select name={name} defaultValue={options[0][0]} className="w-full rounded-lg border border-[#D8DADF] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1877F2]">{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>; }
