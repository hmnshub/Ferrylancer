// Shared building blocks for every screen inside the app shell (Feed, Discover,
// Profile, Messages, etc). Colors are the literal hex values from the Stitch
// "Ferrylance" design system (see DESIGN.md) applied as Tailwind arbitrary
// values, matching how the rest of this codebase (FreelancerOnboarding.jsx)
// already works — no tailwind.config changes required.

export function Icon({ children, className = "", filled = false }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${filled ? "icon-fill" : ""} ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export function Avatar({ src, alt = "", size = 40, className = "" }) {
  const dim = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full border border-[#c7c4d7] bg-[#d3e4fe] ${className}`}
      style={{ width: dim, height: dim }}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#4648d4]">
          <Icon className="text-[60%]">person</Icon>
        </div>
      )}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-[#c7c4d7] bg-white shadow-[0px_4px_12px_-4px_rgba(11,28,48,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-[#e5eeff] text-[#0b1c30]",
    primary: "bg-[#4648d4]/10 text-[#4648d4]",
    success: "bg-[#e3f6ec] text-[#0f7a44]",
    warning: "bg-[#fff4e0] text-[#8a5a00]",
    danger: "bg-[#ffdad6] text-[#93000a]",
  };
  return (
    <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#4648d4] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3a3cc0] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-[#c7c4d7] bg-white px-4 py-2 text-sm font-semibold text-[#0b1c30] transition hover:bg-[#eff4ff] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`flex h-9 w-9 items-center justify-center rounded-full text-[#565e74] transition hover:bg-[#eff4ff] hover:text-[#4648d4] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#4648d4]">{eyebrow}</div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[#0b1c30] md:text-[32px]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-[#565e74]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ icon = "inbox", title, description, action }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eff4ff] text-[#4648d4]">
        <Icon className="text-[26px]">{icon}</Icon>
      </div>
      <div>
        <h3 className="text-sm font-bold text-[#0b1c30]">{title}</h3>
        {description ? <p className="mt-1 max-w-sm text-xs text-[#565e74]">{description}</p> : null}
      </div>
      {action}
    </Card>
  );
}

export function ExternalLinkChip({ link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-[#c7c4d7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0b1c30] transition hover:border-[#4648d4] hover:text-[#4648d4]"
    >
      <Icon className="text-[15px]">{link.icon || "link"}</Icon>
      {link.label}
    </a>
  );
}

export function Loading({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#565e74]">
      <Icon className="animate-spin text-[18px]">progress_activity</Icon>
      {label}
    </div>
  );
}
