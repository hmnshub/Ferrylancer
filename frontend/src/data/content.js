import {
  PenTool, Code2, Megaphone, Video, Languages,
  ShieldCheck, Sparkles, Wallet, MessagesSquare,
  Search, FileEdit, Handshake, Rocket,
  UserPlus, ListChecks, MessageCircle, BadgeCheck,
} from 'lucide-react';

// Colors echo the five hues of Nepali lungta (prayer flags): blue, white, red, green, yellow.
export const categories = [
  { name: 'Design & Branding', icon: PenTool, hex: '#7C5CFC' },
  { name: 'Web & App Dev', icon: Code2, hex: '#1E4FE0' },
  { name: 'Marketing & Social', icon: Megaphone, hex: '#E23744' },
  { name: 'Video & Motion', icon: Video, hex: '#F5A623' },
  { name: 'Writing & Translation', icon: Languages, hex: '#1DA463' },
];

export const problems = [
  {
    title: 'Skilled people, no way to be found',
    body: 'Students, professionals, and career-changers across Nepal have real skills but no easy, trusted place to be discovered by paying clients.',
    accent: '#E23744',
  },
  {
    title: 'Businesses can\u2019t find reliable freelance talent',
    body: 'Hiring locally means messy Facebook groups, no verification, and no way to tell who will actually deliver.',
    accent: '#1E4FE0',
  },
  {
    title: 'Payments are risky for both sides',
    body: 'Without escrow, clients pay upfront and hope, and freelancers deliver first and hope — someone always carries the risk.',
    accent: '#F5A623',
  },
];

export const talentSteps = [
  { icon: UserPlus, title: 'Create your profile', body: 'Add your skills, portfolio, and rate — takes a few minutes to set up.' },
  { icon: ListChecks, title: 'Get matched to work', body: 'We surface projects that fit your skills and availability, whatever your background.' },
  { icon: MessageCircle, title: 'Chat & agree scope', body: 'Discuss the brief directly with the client before anything is confirmed.' },
  { icon: Wallet, title: 'Deliver & get paid', body: 'Funds are held in escrow and released to you the moment the client approves the work.' },
];

export const businessSteps = [
  { icon: FileEdit, title: 'Post your project', body: 'Describe the task, your budget, and your timeline — free to post.' },
  { icon: Search, title: 'Review matched talent', body: 'See profiles picked for your brief, from students to seasoned freelancers.' },
  { icon: Handshake, title: 'Hire with confidence', body: 'Message candidates, compare profiles, and pick who fits best.' },
  { icon: Rocket, title: 'Pay only when satisfied', body: 'Funds release from escrow once you\u2019ve reviewed and approved the work.' },
];

export const features = [
  { icon: ShieldCheck, title: 'Verified profiles', body: 'ID verification for every freelancer, so businesses know who they\u2019re hiring.', accent: '#1E4FE0' },
  { icon: Sparkles, title: 'Smart matching', body: 'Projects reach the right people by skill, not by who scrolls past first.', accent: '#7C5CFC' },
  { icon: Wallet, title: 'Escrow payments', body: 'Funds are held safely and released only when the work is approved.', accent: '#1DA463' },
  { icon: BadgeCheck, title: 'Open to everyone', body: 'Students, professionals, and career-changers — if you can do the work, you belong here.', accent: '#E23744' },
];
