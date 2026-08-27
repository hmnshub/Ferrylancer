// Demo content shown when a table is empty (new project, no data yet) so the
// app doesn't look broken before real users/posts/projects exist. Every page
// tries a real Supabase query first (see src/app/data/queries.js) and falls
// back to this file only when that query returns nothing / Supabase isn't
// configured. Nothing here is written back to the database.

export const samplePeople = [
  { id: "p1", name: "David Chen", title: "Product Manager", avatar: null },
  { id: "p2", name: "Maya Patel", title: "Art Director", avatar: null },
  { id: "p3", name: "Sarah Jenkins", title: "Lead Frontend Engineer at TechFlow", avatar: null },
];

export const samplePosts = [
  {
    id: "post1",
    author: { name: "Sarah Jenkins", title: "Lead Frontend Engineer at TechFlow" },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    content:
      "Just launched the new design system documentation! It's been a massive effort to align our tokens and components, but seeing it come together in a cohesive React library is incredibly rewarding.",
    image: null,
    likes: 124,
    comments: 18,
  },
];

export const sampleOpportunities = [
  {
    id: "opp1",
    title: "React Developer needed for Fintech Dashboard",
    budget: "NPR 30,000 - 50,000",
    estTime: "2 Weeks",
    description:
      "Looking for an experienced frontend developer to build a responsive, high-performance data dashboard for a new financial application.",
    tags: ["React", "Node.js", "Tailwind CSS"],
  },
];

export const sampleRecommended = [
  { id: "rec1", title: "E-commerce UI Redesign", description: "Complete overhaul of a modern fashion retailer's mobile and desktop experience.", type: "Fixed", price: "$1,200" },
  { id: "rec2", title: "Brand Identity for AI Startup", description: "Seeking a minimalist, futuristic logo and brand guidelines.", type: "Hourly", price: "$45/hr" },
];

export const trendingSkills = ["Figma", "React.js", "UI Design", "Typescript", "UX Research", "Node.js"];

export const sampleProjects = [
  {
    id: "proj1",
    title: "Mobile App UI for Fintech Platform",
    client: "NovaPay",
    status: "In Progress",
    budget: "$2,400",
    deadline: "Dec 20, 2026",
    description:
      "Design a clean, trustworthy mobile banking experience covering onboarding, transfers, and card management screens.",
    tags: ["UI/UX Design", "Figma", "Mobile"],
    proposals: 14,
  },
  {
    id: "proj2",
    title: "Redesign Corporate Website",
    client: "Himal Traders",
    status: "Open",
    budget: "$900",
    deadline: "Jan 5, 2027",
    description: "Modernize a 6-page corporate site with a fresh visual identity and mobile-first layout.",
    tags: ["Web Design", "Webflow"],
    proposals: 6,
  },
  {
    id: "proj3",
    title: "Enterprise Dashboard Redesign",
    client: "Skyline Logistics",
    status: "In Progress",
    budget: "$3,100",
    deadline: "Feb 12, 2027",
    description: "Rework the internal operations dashboard used by 200+ staff — focus on data density and speed.",
    tags: ["Product Design", "Data Viz"],
    proposals: 21,
  },
];

export const sampleProposals = [
  { id: "prop1", project: "Mobile App UI for Fintech Platform", client: "NovaPay", status: "Under Review", submitted: "3 days ago", bid: "$2,200" },
  { id: "prop2", project: "Landing Page for SaaS Product", client: "LoopMetrics", status: "Accepted", submitted: "1 week ago", bid: "$650" },
  { id: "prop3", project: "Icon Set for Wellness App", client: "Calmly", status: "Declined", submitted: "2 weeks ago", bid: "$300" },
];

export const sampleConversations = [
  { id: "c1", name: "Sarah Jenkins", lastMessage: "Sounds great, let's sync tomorrow!", time: "2m", unread: 2 },
  { id: "c2", name: "David Chen", lastMessage: "Sent over the revised contract.", time: "1h", unread: 0 },
  { id: "c3", name: "NovaPay Team", lastMessage: "Can you share the latest mockups?", time: "Yesterday", unread: 0 },
];

export const sampleMessages = [
  { id: "m1", from: "them", text: "Hey! Loved the last milestone delivery.", time: "10:02 AM" },
  { id: "m2", from: "me", text: "Thank you! Glad it's working well for the team.", time: "10:05 AM" },
  { id: "m3", from: "them", text: "Sounds great, let's sync tomorrow!", time: "10:06 AM" },
];

export const sampleNotifications = [
  { id: "n1", type: "proposal", text: "Your proposal for \"Mobile App UI for Fintech Platform\" was viewed.", time: "10m ago", unread: true },
  { id: "n2", type: "message", text: "David Chen sent you a message.", time: "1h ago", unread: true },
  { id: "n3", type: "connection", text: "Maya Patel accepted your connection request.", time: "3h ago", unread: false },
  { id: "n4", type: "payment", text: "You received a payment of $650 for LoopMetrics.", time: "1d ago", unread: false },
];

export const sampleEarnings = {
  balance: 1840,
  pending: 620,
  lifetime: 18420,
  transactions: [
    { id: "t1", label: "LoopMetrics — Landing Page", amount: 650, date: "Aug 20, 2026", status: "Completed" },
    { id: "t2", label: "NovaPay — Milestone 2", amount: 1200, date: "Aug 12, 2026", status: "Completed" },
    { id: "t3", label: "Calmly — Icon Set", amount: 300, date: "Aug 2, 2026", status: "Pending" },
  ],
};

export const sampleWorkspaceMilestones = [
  { id: "ms1", title: "Discovery & Wireframes", status: "done", due: "Aug 5, 2026" },
  { id: "ms2", title: "High-fidelity UI", status: "in_progress", due: "Aug 28, 2026" },
  { id: "ms3", title: "Developer Handoff", status: "upcoming", due: "Sep 10, 2026" },
];

export const sampleFreelancerProfile = {
  name: "Aisha Rai",
  title: "Senior Product Designer",
  location: "Kathmandu, Nepal",
  rating: 4.9,
  reviews: 62,
  about:
    "I help startups and growing teams design clean, usable products — from early wireframes through to polished, production-ready UI.",
  skills: ["UI/UX Design", "Figma", "Design Systems", "Prototyping", "User Research"],
  links: [
    { id: "l1", label: "Portfolio", url: "https://example.com", icon: "language" },
    { id: "l2", label: "LinkedIn", url: "https://linkedin.com", icon: "work" },
  ],
};
