import { useRef, useState } from "react";
import { detectLinkMeta, isLikelyUrl, normalizeUrl } from "../../lib/linkUtils";

/* -------------------------------------------------------------------------
   Basic building blocks (icons, labels, inputs, cards, buttons)
   Shared by FreelancerOnboarding.jsx and ClientOnboarding.jsx so both flows
   look and behave identically.
------------------------------------------------------------------------- */

export function Icon({ children, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-7">
      {eyebrow ? (
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#6c6b78]">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="text-[26px] font-bold tracking-tight text-[#131b2e] sm:text-[30px]">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6b78]">{description}</p>
      ) : null}
    </div>
  );
}

export function FormLabel({ children, required = false, optional = false }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#131b2e]">
      {children}
      {required ? <span className="ml-1 text-[#3525cd]">*</span> : null}
      {optional ? (
        <span className="ml-2 text-xs font-medium text-[#8c8b99]">Optional</span>
      ) : null}
    </label>
  );
}

export function FieldHelp({ children }) {
  return <p className="mt-2 text-xs leading-5 text-[#777587]">{children}</p>;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  optional = false,
  help,
}) {
  return (
    <div>
      {label ? (
        <FormLabel required={required} optional={optional}>
          {label}
        </FormLabel>
      ) : null}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 text-sm text-[#131b2e] outline-none transition placeholder:text-[#a6a4b1] focus:border-[#3525cd] focus:ring-4 focus:ring-[#3525cd]/10"
      />
      {help ? <FieldHelp>{help}</FieldHelp> : null}
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 7, help, maxLength }) {
  return (
    <div>
      {label ? <FormLabel>{label}</FormLabel> : null}
      <textarea
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 text-sm leading-6 text-[#131b2e] outline-none transition placeholder:text-[#a6a4b1] focus:border-[#3525cd] focus:ring-4 focus:ring-[#3525cd]/10"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>{help ? <FieldHelp>{help}</FieldHelp> : null}</div>
        {maxLength ? (
          <span className="text-xs text-[#8c8b99]">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function SelectInput({ label, value, onChange, options, optional = false }) {
  return (
    <div>
      {label ? <FormLabel optional={optional}>{label}</FormLabel> : null}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 pr-10 text-sm text-[#131b2e] outline-none transition focus:border-[#3525cd] focus:ring-4 focus:ring-[#3525cd]/10"
        >
          {options.map((option) => {
            const value_ = typeof option === "string" ? option : option.value;
            const label_ = typeof option === "string" ? option : option.label;
            return (
              <option key={value_} value={value_}>
                {label_}
              </option>
            );
          })}
        </select>
        <Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-[#777587]">
          expand_more
        </Icon>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-[#dddbe7] bg-white ${className}`}>{children}</div>
  );
}

export function PrimaryButton({ children, onClick, type = "button", className = "", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#3525cd] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2d20ae] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 text-sm font-semibold text-[#131b2e] transition hover:bg-[#f7f6fb] ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#555460] transition hover:bg-[#f3f2f7] ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f0fb] px-3 py-1.5 text-xs font-semibold text-[#3525cd]">
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label="Remove" className="rounded-full hover:bg-[#e2ddff]">
          <Icon className="text-[15px]">close</Icon>
        </button>
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Reusable onboarding chrome: sidebar stepper (desktop), mobile progress
   header, sticky bottom action bar. Both onboarding flows pass their own
   `steps` array and `brand` label so the chrome adapts automatically.
------------------------------------------------------------------------- */

export function Stepper({ steps, currentStep, setStep, completion, brand, subtitle }) {
  return (
    <aside className="hidden w-[255px] shrink-0 border-r border-[#dedce8] bg-[#fbfaff] xl:block">
      <div className="sticky top-0 p-5">
        <div className="mb-6">
          <div className="text-lg font-extrabold tracking-tight text-[#3525cd]">{brand}</div>
          <div className="text-[11px] text-[#777587]">{subtitle}</div>
        </div>

        <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#777587]">
          Build your profile
        </div>

        <nav className="space-y-1">
          {steps.map((step) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <button
                type="button"
                key={step.id}
                onClick={() => setStep(step.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  isCurrent ? "bg-[#3525cd]/10 text-[#3525cd]" : "text-[#555460] hover:bg-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isCurrent
                      ? "bg-[#3525cd] text-white"
                      : isCompleted
                      ? "bg-[#e9e7ff] text-[#3525cd]"
                      : "bg-[#efedf6] text-[#777587]"
                  }`}
                >
                  {isCompleted ? <Icon className="text-[18px]">check</Icon> : <Icon className="text-[18px]">{step.icon}</Icon>}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{step.title}</span>
                  <span className="mt-0.5 block text-[10px] text-[#8b8997]">
                    Step {step.id} of {steps.length}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-[#dddbe7] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#131b2e]">Profile completion</span>
            <span className="text-xs font-bold text-[#3525cd]">{completion}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eceaf4]">
            <div className="h-full rounded-full bg-[#3525cd] transition-all duration-300" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#777587]">
            You can save and come back anytime — nothing here is lost.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileStepHeader({ steps, currentStep }) {
  const step = steps[currentStep - 1];
  const pct = Math.round((currentStep / steps.length) * 100);
  return (
    <div className="border-b border-[#dedce8] bg-white px-4 py-3 sm:px-6 xl:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[#131b2e]">{step.title}</div>
          <div className="mt-0.5 text-[11px] text-[#777587]">
            Step {currentStep} of {steps.length}
          </div>
        </div>
        <div className="shrink-0 text-xs font-bold text-[#3525cd]">{pct}%</div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eceaf4]">
        <div className="h-full rounded-full bg-[#3525cd] transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function OnboardingTopBar({ brand, subtitle, saved, onSkip, onSaveDraft }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#dedce8] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <div className="text-lg font-extrabold tracking-tight text-[#3525cd]">{brand}</div>
          <div className="hidden text-[10px] text-[#777587] sm:block">{subtitle}</div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {saved ? (
            <div className="hidden items-center gap-1.5 text-xs font-semibold text-[#08753d] sm:flex">
              <Icon className="text-[17px]">check_circle</Icon>
              Saved
            </div>
          ) : null}
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-xl px-2.5 py-2 text-xs font-semibold text-[#555460] transition hover:bg-[#f3f2f7] sm:px-3"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-[#d9d7e3] px-2.5 py-2 text-xs font-semibold text-[#131b2e] transition hover:bg-[#f3f2f7] sm:px-3"
            title="Skip for now — you can finish this anytime from your dashboard"
          >
            Skip for now
          </button>
        </div>
      </div>
    </header>
  );
}

export function OnboardingBottomBar({ steps, currentStep, onBack, onNext, onSaveDraft, onPublish, isLastStep, publishing }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dedce8] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1050px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <div className="hidden items-center gap-2 text-xs text-[#777587] sm:flex">
          <span>
            Step {currentStep} of {steps.length}
          </span>
          <span>•</span>
          <span>{steps[currentStep - 1].title}</span>
        </div>

        <div className="ml-auto flex w-full gap-2 sm:w-auto">
          {currentStep > 1 ? (
            <SecondaryButton onClick={onBack} className="flex-1 px-4 py-2.5 sm:flex-none">
              <Icon className="text-[18px]">arrow_back</Icon>
              Back
            </SecondaryButton>
          ) : null}

          <SecondaryButton onClick={onSaveDraft} className="hidden px-4 py-2.5 sm:inline-flex">
            <Icon className="text-[18px]">draft</Icon>
            Draft
          </SecondaryButton>

          {!isLastStep ? (
            <PrimaryButton onClick={onNext} className="flex-1 px-5 py-2.5 sm:flex-none">
              Continue
              <Icon className="text-[18px]">arrow_forward</Icon>
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={onPublish} disabled={publishing} className="flex-1 px-5 py-2.5 sm:flex-none">
              {publishing ? "Publishing..." : "Publish Profile"}
              <Icon className="text-[18px]">publish</Icon>
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Dynamic links editor
   Replaces the old fixed LinkedIn/GitHub/Behance/... grid. The user pastes
   any URL (YouTube, Instagram, website, GitHub, LinkedIn, etc.), we detect
   the platform automatically and store { id, url, label, key, icon }.
   No video/file upload here — external links only, as requested.
------------------------------------------------------------------------- */

export function DynamicLinks({ links, setLinks }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const addLink = (value) => {
    const raw = (value ?? draft).trim();
    if (!raw) return;
    if (!isLikelyUrl(raw)) {
      setError("That doesn't look like a valid link. Try pasting the full URL.");
      return;
    }
    const meta = detectLinkMeta(raw);
    const url = normalizeUrl(raw);
    if (links.some((link) => link.url === url)) {
      setError("You've already added that link.");
      return;
    }
    setLinks((prev) => [...prev, { id: Date.now(), url, ...meta }]);
    setDraft("");
    setError("");
  };

  const removeLink = (id) => setLinks((prev) => prev.filter((link) => link.id !== id));

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addLink();
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <FormLabel optional>Add a link</FormLabel>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a YouTube, Instagram, GitHub, website, LinkedIn link..."
          className="min-w-0 flex-1 rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 text-sm text-[#131b2e] outline-none transition placeholder:text-[#a6a4b1] focus:border-[#3525cd] focus:ring-4 focus:ring-[#3525cd]/10"
        />
        <SecondaryButton onClick={() => addLink()} className="px-4 py-3">
          <Icon className="text-[18px]">add</Icon>
          Add link
        </SecondaryButton>
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-[#ba1a1a]">{error}</p> : null}
      <FieldHelp>
        We don't support video uploads yet — share a YouTube/Instagram link instead for videos or design reels.
        Add as many links as you like: portfolio site, GitHub, LinkedIn, Behance, Dribbble, anything relevant.
      </FieldHelp>

      {links.length ? (
        <ul className="mt-5 flex flex-col gap-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center gap-3 rounded-xl border border-[#d9d7e3] bg-[#fbfaff] px-3.5 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f0fb] text-[#3525cd]">
                <Icon className="text-[18px]">{link.icon}</Icon>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-[#131b2e]">{link.label}</div>
                <div className="truncate text-xs text-[#777587]">{link.url}</div>
              </div>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className="shrink-0 rounded-lg p-1.5 text-[#8c8b99] hover:bg-[#efedf6] hover:text-[#ba1a1a]"
                aria-label={`Remove ${link.label}`}
              >
                <Icon className="text-[18px]">delete</Icon>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-[#d9d7e3] bg-[#fbfaff] px-4 py-6 text-center text-xs text-[#8c8b99]">
          No links added yet.
        </p>
      )}
    </Card>
  );
}

export function PhotoUpload({ label, help, photo, setPhoto, shape = "square", icon = "person" }) {
  const fileRef = useRef(null);
  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhoto({ file, url });
  };

  const shapeClass = shape === "round" ? "rounded-full" : "rounded-2xl";

  return (
    <Card className="p-5 sm:p-6">
      <FormLabel required>{label}</FormLabel>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative">
          <div className={`flex h-24 w-24 items-center justify-center overflow-hidden border border-[#d9d7e3] bg-[#f1effb] ${shapeClass}`}>
            {photo?.url ? (
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon className="text-[30px] text-[#3525cd]">{icon}</Icon>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#3525cd] text-white shadow-sm"
            aria-label={`Upload ${label}`}
          >
            <Icon className="text-[18px]">camera_alt</Icon>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhoto} />
        </div>
        <div>
          <div className="text-sm font-semibold text-[#131b2e]">Upload an image</div>
          <p className="mt-1 max-w-md text-xs leading-5 text-[#777587]">{help}</p>
          <SecondaryButton className="mt-3 px-3 py-2.5 text-xs" onClick={() => fileRef.current?.click()}>
            <Icon className="text-[17px]">upload</Icon>
            Choose photo
          </SecondaryButton>
        </div>
      </div>
    </Card>
  );
}

export const MATERIAL_SYMBOLS_IMPORT =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200";
