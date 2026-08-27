import { useState } from "react";
import { useParams } from "react-router-dom";
import { useSupabaseQuery } from "../data/useSupabaseQuery";
import { sampleProjects, sampleWorkspaceMilestones } from "../data/sampleData";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

const TABS = ["Overview", "Tasks", "Milestones", "Files", "Payments"];

export default function ProjectWorkspace() {
  const { id } = useParams();
  const [tab, setTab] = useState("Overview");

  const { data: project } = useSupabaseQuery(
    (sb) => sb.from("projects").select("*").eq("id", id).maybeSingle(),
    [id],
    sampleProjects.find((p) => p.id === id) || sampleProjects[0]
  );

  if (!project) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-[#565e74]">
            Client: {project.client}
            <Badge tone="primary">{project.status}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] md:text-[32px]">{project.title}</h1>
        </div>
        <SecondaryButton>
          <Icon className="text-[18px]">edit</Icon>
          Edit Details
        </SecondaryButton>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-[#c7c4d7] bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-[#4648d4] text-white" : "text-[#565e74] hover:bg-[#eff4ff]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Total Progress" value="65%" />
              <Stat label="Time Logged" value="42h" />
              <Stat label="Deadline" value={project.deadline} />
            </div>

            <Card className="p-6">
              <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#4648d4]">Current Milestone · Active</div>
              <h3 className="mb-1 text-lg font-bold text-[#0b1c30]">Phase 2: Wireframing &amp; Prototyping</h3>
              <p className="text-sm text-[#565e74]">Due in 5 days · $2,500</p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0b1c30]">Recent Tasks</h3>
                <button className="text-xs font-semibold text-[#4648d4]">View All</button>
              </div>
              <div className="space-y-3">
                <TaskRow title="Finalize User Flows" assignee="You" status="Completed" date="Oct 12" />
                <TaskRow title="Design System Setup" assignee="You" status="In Progress" date="Oct 15" />
                <TaskRow title="High-Fidelity Mockups" assignee="Sarah J." status="To Do" date="Oct 20" />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[#0b1c30]">
                <Icon className="text-[#4648d4]">account_balance</Icon>
                Budget Summary
              </h3>
              <div className="text-2xl font-bold text-[#0b1c30]">{project.budget || "$12,000"}</div>
              <div className="text-xs text-[#565e74]">Total Budget</div>
            </Card>
          </div>
        </div>
      ) : tab === "Milestones" ? (
        <div className="space-y-3">
          {sampleWorkspaceMilestones.map((ms) => (
            <Card key={ms.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Icon
                  filled={ms.status === "done"}
                  className={
                    ms.status === "done" ? "text-[#0f7a44]" : ms.status === "in_progress" ? "text-[#4648d4]" : "text-[#c7c4d7]"
                  }
                >
                  {ms.status === "done" ? "check_circle" : "radio_button_unchecked"}
                </Icon>
                <div>
                  <div className="text-sm font-semibold text-[#0b1c30]">{ms.title}</div>
                  <div className="text-xs text-[#565e74]">Due {ms.due}</div>
                </div>
              </div>
              <Badge tone={ms.status === "done" ? "success" : ms.status === "in_progress" ? "primary" : "neutral"}>
                {ms.status.replace("_", " ")}
              </Badge>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Icon className="text-[26px] text-[#4648d4]">construction</Icon>
          <div className="text-sm font-semibold text-[#0b1c30]">{tab} coming soon</div>
          <p className="max-w-sm text-xs text-[#565e74]">
            This tab is wired to the Node.js backend endpoints (see /server) — connect real data whenever you're ready.
          </p>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#c7c4d7] bg-white p-4 text-center">
      <div className="text-xl font-bold text-[#0b1c30]">{value}</div>
      <div className="text-xs text-[#565e74]">{label}</div>
    </div>
  );
}

function TaskRow({ title, assignee, status, date }) {
  const tone = status === "Completed" ? "success" : status === "In Progress" ? "primary" : "neutral";
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#e5eeff] p-3">
      <div>
        <div className="text-sm font-semibold text-[#0b1c30]">{title}</div>
        <div className="text-xs text-[#565e74]">Assigned to: {assignee}</div>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={tone}>{status}</Badge>
        <span className="text-xs text-[#565e74]">{date}</span>
      </div>
    </div>
  );
}
