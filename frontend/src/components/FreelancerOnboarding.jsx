import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { DynamicLinks } from "./onboarding/shared";
import { draftKey, setOnboardingSkipped } from "../lib/onboardingStatus";
import { isLikelyUrl, normalizeUrl } from "../lib/linkUtils";

/*
  Hamro Bridge - Freelancer Onboarding
  ------------------------------------
  One-file React implementation of the 8 Stitch onboarding screens:

  1. Basic Information
  2. Professional Details
  3. About You
  4. Skills & Services
  5. Portfolio
  6. Experience
  7. Links
  8. Profile Preview

  Drop this file into:
  src/components/FreelancerOnboarding.jsx

  Then render:
  <FreelancerOnboarding />
*/

const STEPS = [
  { id: 1, title: "Basic Information", icon: "person" },
  { id: 2, title: "Professional Details", icon: "work" },
  { id: 3, title: "About You", icon: "edit_note" },
  { id: 4, title: "Skills & Services", icon: "auto_awesome" },
  { id: 5, title: "Portfolio", icon: "collections" },
  { id: 6, title: "Experience", icon: "business_center" },
  { id: 7, title: "Links", icon: "link" },
  { id: 8, title: "Profile Preview", icon: "visibility" },
];

const SUGGESTED_SKILLS = [
  "Video Editing",
  "Motion Graphics",
  "Color Grading",
  "After Effects",
  "Premiere Pro",
  "DaVinci Resolve",
  "Social Media Videos",
  "YouTube Editing",
  "Sound Design",
  "Short-form Content",
];

const SERVICE_TEMPLATES = [
  "YouTube Video Editing",
  "Short Form Content",
  "Social Media Campaign",
  "Motion Graphics",
];

const initialForm = {
  fullName: "",
  title: "",
  location: "",
  shortIntro: "",
  category: "",
  specialization: "",
  experienceYears: "",
  about: "",
  availability: "",
};

const initialPortfolio = [];

const initialExperience = [];

const initialEducation = [];

const initialCertifications = [];

function Icon({ children, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, description }) {
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
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c6b78]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FormLabel({ children, required = false, optional = false }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#131b2e]">
      {children}
      {required ? <span className="ml-1 text-[#3525cd]">*</span> : null}
      {optional ? (
        <span className="ml-2 text-xs font-medium text-[#8c8b99]">
          Optional
        </span>
      ) : null}
    </label>
  );
}

function FieldHelp({ children }) {
  return <p className="mt-2 text-xs leading-5 text-[#777587]">{children}</p>;
}

function TextInput({
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
      <FormLabel required={required} optional={optional}>
        {label}
      </FormLabel>
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

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 7,
  help,
  maxLength,
}) {
  return (
    <div>
      <FormLabel>{label}</FormLabel>
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

function SelectInput({ label, value, onChange, options, optional = false }) {
  return (
    <div>
      <FormLabel optional={optional}>{label}</FormLabel>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 pr-10 text-sm text-[#131b2e] outline-none transition focus:border-[#3525cd] focus:ring-4 focus:ring-[#3525cd]/10"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-[#777587]">
          expand_more
        </Icon>
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[#dddbe7] bg-white ${className}`}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, type = "button", className = "", disabled = false }) {
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

function SecondaryButton({ children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 text-sm font-semibold text-[#131b2e] transition hover:bg-[#f7f6fb] ${className}`}
    >
      {children}
    </button>
  );
}

function Stepper({ currentStep, setStep, completion }) {
  return (
    <aside className="hidden w-[255px] shrink-0 border-r border-[#dedce8] bg-[#fbfaff] xl:block">
      <div className="sticky top-0 p-5">
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="text-lg font-extrabold tracking-tight text-[#3525cd]">Ferrylancer</div>
              <div className="text-[11px] text-[#777587]">Freelancer setup</div>
            </div>
          </div>
        </div>

        <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#777587]">
          Build your profile
        </div>

        <nav className="space-y-1">
          {STEPS.map((step) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <button
                type="button"
                key={step.id}
                onClick={() => setStep(step.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                  isCurrent
                    ? "bg-[#3525cd]/10 text-[#3525cd]"
                    : "text-[#555460] hover:bg-white"
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
                  {isCompleted ? (
                    <Icon className="text-[18px]">check</Icon>
                  ) : (
                    <Icon className="text-[18px]">{step.icon}</Icon>
                  )}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#8b8997]">
                    Step {step.id} of 8
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-[#dddbe7] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#131b2e]">
              Profile completion
            </span>
            <span className="text-xs font-bold text-[#3525cd]">{completion}%</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eceaf4]">
            <div
              className="h-full rounded-full bg-[#3525cd] transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>

          <p className="mt-3 text-[11px] leading-5 text-[#777587]">
            You're almost ready to publish a client-ready profile.
          </p>
        </div>
      </div>
    </aside>
  );
}

function MobileStepHeader({ currentStep, setStep }) {
  const step = STEPS[currentStep - 1];

  return (
    <div className="border-b border-[#dedce8] bg-white px-4 py-3 sm:px-6 lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[#131b2e]">
            {step.title}
          </div>
          <div className="mt-0.5 text-[11px] text-[#777587]">
            Step {currentStep} of 8
          </div>
        </div>

        <div className="shrink-0 text-xs font-bold text-[#3525cd]">
          {Math.round((currentStep / 8) * 100)}%
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eceaf4]">
        <div
          className="h-full rounded-full bg-[#3525cd] transition-all duration-300"
          style={{ width: `${(currentStep / 8) * 100}%` }}
        />
      </div>
      <nav className="mt-3 -mx-1 flex gap-1 overflow-x-auto pb-0.5" aria-label="Onboarding steps">
        {STEPS.map((item) => {
          const isCurrent = item.id === currentStep;
          const isCompleted = item.id < currentStep;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setStep(item.id)}
              aria-current={isCurrent ? "step" : undefined}
              className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                isCurrent
                  ? "bg-[#3525cd] text-white"
                  : isCompleted
                  ? "bg-[#e9e7ff] text-[#3525cd]"
                  : "bg-[#f3f1f9] text-[#777587]"
              }`}
            >
              {item.id}. {item.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function BasicInformation({ form, updateField, profilePhoto, setProfilePhoto }) {
  const fileRef = useRef(null);

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setProfilePhoto({
      file,
      url,
    });
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Step 1"
        title="Basic Information"
        description="Start with the essentials clients need to know about you."
      />

      <div className="grid gap-7">
        <Card className="p-5 sm:p-6">
          <FormLabel required>Profile Photo</FormLabel>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-[#d9d7e3] bg-[#f1effb]">
                {profilePhoto?.url ? (
                  <img
                    src={profilePhoto.url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="text-[30px] text-[#3525cd]">person</Icon>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#3525cd] text-white shadow-sm"
                aria-label="Upload profile photo"
              >
                <Icon className="text-[18px]">camera_alt</Icon>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handlePhoto}
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-[#131b2e]">
                Upload a professional photo
              </div>
              <p className="mt-1 max-w-md text-xs leading-5 text-[#777587]">
                Use a clear headshot with good lighting. JPG, PNG or WebP up to
                5MB.
              </p>

              <SecondaryButton
                className="mt-3 px-3 py-2.5 text-xs"
                onClick={() => fileRef.current?.click()}
              >
                <Icon className="text-[17px]">upload</Icon>
                Choose photo
              </SecondaryButton>
            </div>
          </div>
        </Card>

        <Card className="grid gap-5 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput
              label="Full Name"
              required
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              placeholder="Enter your full name"
            />

            <TextInput
              label="Professional Title"
              required
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Senior UX Designer"
            />
          </div>

          <TextInput
            label="Location"
            required
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="City, Country"
          />

          <div>
            <TextArea
              label="Short Introduction"
              value={form.shortIntro}
              onChange={(e) => updateField("shortIntro", e.target.value)}
              rows={5}
              maxLength={300}
              placeholder="Briefly describe your expertise and professional background..."
              help="This short summary will appear near the top of your public profile."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProfessionalDetails({ form, updateField, skills, setSkills }) {
  const services = [
    "Video Editing",
    "Motion Graphics",
    "Social Media Videos",
    "Color Grading",
    "YouTube Editing",
    "Short-form Content",
  ];

  const toggleService = (name) => {
    setSkills((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Step 2"
        title="Professional Details"
        description="Help clients understand your core expertise and the kind of work you offer."
      />

      <Card className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <SelectInput
            label="Primary Category"
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            options={[
              "Design & Creative",
              "Development & IT",
              "Writing & Translation",
              "Marketing & Sales",
              "Business & Consulting",
            ]}
          />

          <SelectInput
            label="Specialization"
            value={form.specialization}
            onChange={(e) => updateField("specialization", e.target.value)}
            options={[
              "Video Editing & Motion Design",
              "UI/UX Design",
              "Graphic Design",
              "Web Development",
              "Mobile App Development",
            ]}
          />
        </div>

        <SelectInput
          label="Years of Experience"
          value={form.experienceYears}
          onChange={(e) => updateField("experienceYears", e.target.value)}
          options={["5+ years", "3-4 years", "1-2 years", "Less than 1 year"]}
        />

        <div>
          <FormLabel>Services Offered</FormLabel>
          <p className="mb-3 text-xs text-[#777587]">
            Select multiple services you are comfortable delivering.
          </p>

          <div className="flex flex-wrap gap-2.5">
            {services.map((service) => {
              const selected = skills.includes(service);

              return (
                <button
                  type="button"
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                    selected
                      ? "border-[#3525cd] bg-[#3525cd]/10 text-[#3525cd]"
                      : "border-[#d9d7e3] bg-white text-[#555460] hover:bg-[#f7f6fb]"
                  }`}
                >
                  {selected ? "✓ " : ""}
                  {service}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function AboutYou({ form, updateField }) {
  return (
    <div>
      <SectionHeading
        eyebrow="Step 3"
        title="About You"
        description="Tell clients what you specialize in, who you work with, and what makes your work valuable."
      />

      <Card className="p-5 sm:p-6">
        <TextArea
          label="About You"
          value={form.about}
          onChange={(e) => updateField("about", e.target.value)}
          rows={12}
          maxLength={1200}
          placeholder="Explain what you specialize in, who you work with, and what makes your work valuable."
          help="Write in a client-friendly way. Focus on outcomes, specialties, and the types of projects you enjoy."
        />

        <button
          type="button"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#d9d7e3] bg-[#fbfaff] px-4 py-3 text-sm font-semibold text-[#3525cd] transition hover:bg-[#f3f1ff]"
        >
          <Icon className="text-[18px]">auto_awesome</Icon>
          Improve with AI
        </button>

        <div className="mt-5 rounded-xl bg-[#f5f3ff] p-4">
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 text-[19px] text-[#3525cd]">
              lightbulb
            </Icon>
            <div>
              <div className="text-xs font-bold text-[#3525cd]">
                Tip for a stronger profile
              </div>
              <p className="mt-1 text-xs leading-5 text-[#5e5c6b]">
                Mention the problems you solve, your strongest tools, and the
                results clients can expect from working with you.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SkillsServices({
  skills,
  setSkills,
  services,
  setServices,
}) {
  const [query, setQuery] = useState("");

  const addSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
    setQuery("");
  };

  const removeSkill = (skill) => {
    setSkills((prev) => prev.filter((item) => item !== skill));
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "New Service",
        description: "Describe what clients receive.",
        startingPrice: "NPR 5,000",
        delivery: "3-5 days",
      },
    ]);
  };

  const removeService = (id) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  const updateService = (id, key, value) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, [key]: value } : service
      )
    );
  };

  const filteredSuggestions = SUGGESTED_SKILLS.filter(
    (skill) =>
      !skills.includes(skill) &&
      skill.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  return (
    <div>
      <SectionHeading
        eyebrow="Step 4"
        title="Skills & Services"
        description="Showcase the skills you want clients to discover and the services you are ready to offer."
      />

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <h3 className="text-base font-bold text-[#131b2e]">Your Skills</h3>
          <p className="mt-1 text-xs text-[#777587]">
            Search and add the tools, disciplines, and specialties you work with.
          </p>

          <div className="relative mt-4">
            <div className="flex items-center gap-2 rounded-xl border border-[#d9d7e3] bg-white px-3.5 py-3 focus-within:border-[#3525cd] focus-within:ring-4 focus-within:ring-[#3525cd]/10">
              <Icon className="text-[19px] text-[#777587]">search</Icon>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-[#a6a4b1] focus:ring-0"
                placeholder="Search and add skills..."
              />
            </div>

            {query && filteredSuggestions.length > 0 ? (
              <div className="absolute left-0 right-0 top-[58px] z-10 rounded-xl border border-[#dddbe7] bg-white p-2 shadow-xl">
                {filteredSuggestions.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => addSkill(skill)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-[#131b2e] hover:bg-[#f6f5fa]"
                  >
                    <span>{skill}</span>
                    <Icon className="text-[18px] text-[#777587]">add</Icon>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 rounded-full bg-[#e8e5ff] px-3 py-2 text-xs font-semibold text-[#3525cd]"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full text-[#3525cd]/70 hover:text-[#3525cd]"
                  aria-label={`Remove ${skill}`}
                >
                  <Icon className="text-[15px]">close</Icon>
                </button>
              </span>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#777587]">
              Suggested based on your profile
            </div>

            <div className="flex flex-wrap gap-2">
              {["Video Editing", "Motion Graphics", "Color Grading"].map(
                (skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => addSkill(skill)}
                    className="rounded-full border border-[#d9d7e3] bg-white px-3 py-2 text-xs font-semibold text-[#555460] transition hover:bg-[#f7f6fb]"
                  >
                    + {skill}
                  </button>
                )
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Your Services
              </h3>
              <p className="mt-1 text-xs text-[#777587]">
                Add service packages that clients can understand quickly.
              </p>
            </div>

            <SecondaryButton onClick={addService} className="px-3 py-2.5 text-xs">
              <Icon className="text-[18px]">add</Icon>
              Add Service
            </SecondaryButton>
          </div>

          <div className="mt-5 space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-[#dddbe7] bg-[#fbfaff] p-4"
              >
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div className="grid gap-3">
                    <input
                      value={service.name}
                      onChange={(e) =>
                        updateService(service.id, "name", e.target.value)
                      }
                      className="rounded-lg border border-[#d9d7e3] bg-white px-3 py-2.5 text-sm font-semibold text-[#131b2e] outline-none focus:border-[#3525cd]"
                    />

                    <textarea
                      rows={2}
                      value={service.description}
                      onChange={(e) =>
                        updateService(
                          service.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="resize-none rounded-lg border border-[#d9d7e3] bg-white px-3 py-2.5 text-xs leading-5 text-[#555460] outline-none focus:border-[#3525cd]"
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={service.startingPrice}
                        onChange={(e) =>
                          updateService(
                            service.id,
                            "startingPrice",
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-[#d9d7e3] bg-white px-3 py-2.5 text-xs text-[#131b2e] outline-none focus:border-[#3525cd]"
                        placeholder="Starting price"
                      />

                      <input
                        value={service.delivery}
                        onChange={(e) =>
                          updateService(service.id, "delivery", e.target.value)
                        }
                        className="rounded-lg border border-[#d9d7e3] bg-white px-3 py-2.5 text-xs text-[#131b2e] outline-none focus:border-[#3525cd]"
                        placeholder="Typical delivery"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeService(service.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#777587] transition hover:bg-white hover:text-[#ba1a1a] md:self-start"
                    aria-label={`Remove ${service.name}`}
                  >
                    <Icon className="text-[20px]">delete</Icon>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Portfolio({
  portfolio,
  setPortfolio,
  onOpenProjectModal,
}) {
  const handleDelete = (id) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Step 5"
        title="Portfolio"
        description="Show clients the type and quality of work they can expect from you."
      />

      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {portfolio.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-[#dddbe7] bg-white"
            >
              <div className="flex h-44 items-center justify-center bg-[#ebe9ff]">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#3525cd]">
                    <Icon className="text-[35px]">{item.externalLink ? "smart_display" : "image"}</Icon>
                    <span className="text-[11px] font-semibold">
                      {item.mediaName || (item.externalLink ? "Linked video/demo" : "Portfolio preview")}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#777587]">
                  {item.category}
                </div>
                <h3 className="mt-1 text-sm font-bold text-[#131b2e]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-[#777587]">
                  {item.description}
                </p>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProjectModal(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3525cd]"
                  >
                    <Icon className="text-[17px]">edit</Icon>
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#ba1a1a]"
                  >
                    <Icon className="text-[17px]">delete</Icon>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onOpenProjectModal(null)}
            className="flex min-h-[290px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cfcbdc] bg-[#fbfaff] px-6 text-center transition hover:border-[#3525cd] hover:bg-[#f7f5ff]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8e5ff] text-[#3525cd]">
              <Icon className="text-[25px]">add</Icon>
            </div>
            <div className="mt-3 text-sm font-bold text-[#131b2e]">
              Add Portfolio Project
            </div>
            <p className="mt-1 max-w-xs text-xs leading-5 text-[#777587]">
              Upload an image or add a link to your best work.
            </p>
          </button>
        </div>
      </Card>
    </div>
  );
}

function Experience({ experience, setExperience, education, setEducation, certifications, setCertifications }) {
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [showCertificationForm, setShowCertificationForm] = useState(false);

  const addExperience = () => {
    setExperience((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "New Role",
        company: "Company / Client",
        start: "2025",
        end: "Present",
        description: "Describe your responsibilities and impact.",
      },
    ]);
    setShowExperienceForm(false);
  };

  const addEducation = () => {
    setEducation((prev) => [
      ...prev,
      {
        id: Date.now(),
        degree: "New Qualification",
        institution: "Institution",
        year: "2025",
      },
    ]);
    setShowEducationForm(false);
  };

  const addCertification = () => {
    setCertifications((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "New Certification",
        issuer: "Issuer",
        year: "2025",
      },
    ]);
    setShowCertificationForm(false);
  };

  return (
    <div>
      <SectionHeading
        eyebrow="Step 6"
        title="Experience"
        description="Build trust by showing where you've worked and what you've learned."
      />

      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Work Experience
              </h3>
              <p className="mt-1 text-xs text-[#777587]">
                Add roles, clients, and projects that demonstrate your expertise.
              </p>
            </div>

            <SecondaryButton
              onClick={() => setShowExperienceForm((value) => !value)}
              className="px-3 py-2.5 text-xs"
            >
              <Icon className="text-[18px]">add</Icon>
              Add Experience
            </SecondaryButton>
          </div>

          {showExperienceForm ? (
            <div className="mt-5 rounded-xl border border-[#dddbe7] bg-[#fbfaff] p-4">
              <p className="text-xs leading-5 text-[#777587]">
                A new experience entry will be added with editable placeholder
                values.
              </p>
              <PrimaryButton onClick={addExperience} className="mt-3 px-3 py-2.5 text-xs">
                Add experience
              </PrimaryButton>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {experience.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#dddbe7] bg-[#fbfaff] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8e5ff] text-[#3525cd]">
                    <Icon className="text-[20px]">business_center</Icon>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#131b2e]">
                      {item.role}
                    </div>
                    <div className="mt-0.5 text-xs font-medium text-[#555460]">
                      {item.company}
                    </div>
                    <div className="mt-1 text-[11px] text-[#8c8b99]">
                      {item.start} — {item.end}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#777587]">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExperience((prev) =>
                        prev.map((entry) =>
                          entry.id === item.id
                            ? {
                                ...entry,
                                role:
                                  entry.role === "New Role"
                                    ? "Video Editor"
                                    : entry.role,
                              }
                            : entry
                        )
                      )
                    }
                    className="rounded-lg p-2 text-[#777587] hover:bg-white"
                    aria-label="Edit experience"
                  >
                    <Icon className="text-[18px]">edit</Icon>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Education <span className="text-xs font-medium text-[#8c8b99]">Optional</span>
              </h3>
            </div>

            <SecondaryButton
              onClick={() => setShowEducationForm((value) => !value)}
              className="px-3 py-2.5 text-xs"
            >
              <Icon className="text-[18px]">add</Icon>
              Add Education
            </SecondaryButton>
          </div>

          {showEducationForm ? (
            <div className="mt-5">
              <PrimaryButton onClick={addEducation} className="px-3 py-2.5 text-xs">
                Add education
              </PrimaryButton>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {education.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#dddbe7] bg-[#fbfaff] p-4"
              >
                <div className="text-sm font-bold text-[#131b2e]">
                  {item.degree}
                </div>
                <div className="mt-1 text-xs text-[#555460]">
                  {item.institution} • {item.year}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#131b2e]">
                Certifications <span className="text-xs font-medium text-[#8c8b99]">Optional</span>
              </h3>
            </div>

            <SecondaryButton
              onClick={() => setShowCertificationForm((value) => !value)}
              className="px-3 py-2.5 text-xs"
            >
              <Icon className="text-[18px]">add</Icon>
              Add Certification
            </SecondaryButton>
          </div>

          {showCertificationForm ? (
            <div className="mt-5">
              <PrimaryButton
                onClick={addCertification}
                className="px-3 py-2.5 text-xs"
              >
                Add certification
              </PrimaryButton>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {certifications.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#dddbe7] bg-[#fbfaff] p-4"
              >
                <div className="text-sm font-bold text-[#131b2e]">
                  {item.name}
                </div>
                <div className="mt-1 text-xs text-[#555460]">
                  {item.issuer} • {item.year}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Links({ links, setLinks }) {
  return (
    <div>
      <SectionHeading
        eyebrow="Step 7"
        title="Links"
        description="Give clients more ways to explore your work. Paste any relevant link — portfolio site, GitHub, LinkedIn, Behance, Dribbble, or a YouTube/Instagram link for video and design work."
      />
      <DynamicLinks links={links} setLinks={setLinks} />
    </div>
  );
}

function ProfilePreview({
  form,
  skills,
  services,
  portfolio,
  profilePhoto,
  links,
}) {
  const completion = useMemo(() => {
    let score = 60;

    if (form.fullName && form.title) score += 5;
    if (form.location) score += 5;
    if (form.about) score += 8;
    if (skills.length >= 4) score += 5;
    if (portfolio.length >= 2) score += 5;
    if (links.length) score += 2;
    if (services.length >= 2) score += 5;

    return Math.min(score, 99);
  }, [form, skills, services, portfolio, links]);

  return (
    <div>
      <SectionHeading
        eyebrow="Step 8"
        title="Your profile is ready"
        description="Here's how clients will see your freelancer profile. Review everything before you publish."
      />

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="h-32 bg-[#bdb8ff] sm:h-40" />

          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#efedf7] shadow-sm sm:h-28 sm:w-28">
                  {profilePhoto?.url ? (
                    <img
                      src={profilePhoto.url}
                      alt={form.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon className="text-[34px] text-[#777587]">
                      person
                    </Icon>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:pb-1">
                <SecondaryButton className="px-4 py-2.5 text-xs">
                  Message
                </SecondaryButton>
                <PrimaryButton className="px-4 py-2.5 text-xs">
                  Invite to Project
                </PrimaryButton>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#131b2e]">
                  {form.fullName || "Your Name"}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f8ed] px-2.5 py-1 text-[10px] font-bold text-[#08753d]">
                  <Icon className="text-[14px]">verified</Icon>
                  Verified
                </span>
              </div>

              <div className="mt-1 text-sm font-medium text-[#555460]">
                {form.title || "Professional Title"}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#777587]">
                <span>{form.location}</span>
                <span>•</span>
                <span>{form.experienceYears}</span>
                <span>•</span>
                <span className="font-semibold text-[#0b8c4c]">
                  {form.availability}
                </span>
              </div>
            </div>

            <div className="mt-7 grid gap-7 lg:grid-cols-[1.35fr_0.85fr]">
              <div className="space-y-7">
                <section>
                  <h3 className="text-sm font-bold text-[#131b2e]">About</h3>
                  <p className="mt-2 text-sm leading-6 text-[#555460]">
                    {form.about}
                  </p>
                </section>

                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-[#131b2e]">
                      Portfolio
                    </h3>
                    <span className="text-xs text-[#777587]">
                      {portfolio.length} projects
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {portfolio.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-xl border border-[#dddbe7]"
                      >
                        <div className="flex h-32 items-center justify-center overflow-hidden bg-[#ebe9ff] text-[#3525cd]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="text-[28px]">
                              {item.externalLink ? "smart_display" : "image"}
                            </Icon>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-bold text-[#131b2e]">
                            {item.title}
                          </div>
                          <div className="mt-1 text-[10px] text-[#777587]">
                            {item.category}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-[#131b2e]">
                    Services
                  </h3>

                  <div className="mt-3 space-y-2">
                    {services.slice(0, 3).map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#dddbe7] p-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#131b2e]">
                            {service.name}
                          </div>
                          <div className="mt-1 text-[10px] text-[#777587]">
                            {service.delivery}
                          </div>
                        </div>

                        <div className="text-xs font-bold text-[#3525cd]">
                          {service.startingPrice}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <Card className="bg-[#fbfaff] p-4">
                  <div className="text-xs font-bold text-[#131b2e]">
                    Profile Strength
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#777587]">
                      Excellent
                    </span>
                    <span className="text-sm font-bold text-[#3525cd]">
                      {completion}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e7f1]">
                    <div
                      className="h-full rounded-full bg-[#3525cd]"
                      style={{ width: `${completion}%` }}
                    />
                  </div>

                  <p className="mt-3 text-[11px] leading-5 text-[#777587]">
                    A stronger profile gives clients more confidence when
                    deciding whom to invite.
                  </p>
                </Card>

                <Card className="bg-[#fbfaff] p-4">
                  <div className="text-xs font-bold text-[#131b2e]">Skills</div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.slice(0, 10).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[#e8e5ff] px-2.5 py-1.5 text-[10px] font-semibold text-[#3525cd]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>

                <Card className="bg-[#fbfaff] p-4">
                  <div className="text-xs font-bold text-[#131b2e]">Links</div>

                  <div className="mt-3 space-y-2">
                    {links.slice(0, 6).map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-[#3525cd] hover:underline"
                      >
                        <Icon className="text-[16px]">{link.icon || "link"}</Icon>
                        <span className="truncate">{link.url}</span>
                      </a>
                    ))}

                    {!links.length ? (
                      <div className="text-xs text-[#8c8b99]">
                        Add your professional links in Step 7.
                      </div>
                    ) : null}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        <div className="rounded-2xl border border-[#d9d7e3] bg-[#f5f3ff] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#3525cd]">
              <Icon className="text-[20px]">check_circle</Icon>
            </div>

            <div>
              <div className="text-sm font-bold text-[#131b2e]">
                Your profile is ready to publish.
              </div>
              <p className="mt-1 text-xs leading-5 text-[#777587]">
                You can still edit your profile later from your freelancer
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioModal({ project, onClose, onSave }) {
  const [draft, setDraft] = useState(
    project || {
      id: Date.now(),
      title: "New Portfolio Project",
      category: "Video Editing",
      description: "Describe the project, your contribution, and the outcome.",
      mediaName: "",
      imageUrl: "",
      externalLink: "",
    }
  );

  const [fileName, setFileName] = useState(draft.mediaName || "");
  const [imageUrl, setImageUrl] = useState(draft.imageUrl || "");
  const [externalLink, setExternalLink] = useState(draft.externalLink || "");
  const [linkError, setLinkError] = useState("");

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (externalLink && !isLikelyUrl(externalLink)) {
      setLinkError("That doesn't look like a valid link.");
      return;
    }
    onSave({
      ...draft,
      mediaName: fileName,
      imageUrl,
      externalLink: externalLink ? normalizeUrl(externalLink) : "",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#131b2e]/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#dddbe7] bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#dddbe7] bg-white px-5 py-4">
          <div>
            <div className="text-sm font-bold text-[#131b2e]">
              {project ? "Edit Portfolio Project" : "Add Portfolio Project"}
            </div>
            <div className="mt-1 text-[11px] text-[#777587]">
              Give clients enough context to understand the work.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#777587] hover:bg-[#f5f4f8]"
            aria-label="Close"
          >
            <Icon className="text-[20px]">close</Icon>
          </button>
        </div>

        <div className="space-y-5 p-5">
          <TextInput
            label="Project Title"
            required
            value={draft.title}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="e.g. Social Media Campaign for Local Brand"
          />

          <SelectInput
            label="Category"
            value={draft.category}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, category: e.target.value }))
            }
            options={[
              "Video Editing",
              "Motion Graphics",
              "Branding",
              "UI/UX Design",
              "Development",
            ]}
          />

          <TextArea
            label="Description"
            value={draft.description}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            rows={4}
            maxLength={400}
            placeholder="Describe the project and your contribution."
          />

          <div>
            <FormLabel optional>Project Image</FormLabel>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#cfcbde] bg-[#fbfaff] p-5 transition hover:border-[#3525cd]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8e5ff] text-[#3525cd]">
                <Icon className="text-[22px]">upload</Icon>
              </div>
              <div>
                <div className="text-xs font-bold text-[#131b2e]">
                  Upload an image
                </div>
                <div className="mt-1 text-[11px] text-[#777587]">
                  {fileName || "JPG, PNG or WebP"}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <div>
            <FormLabel optional>External Link (video or live demo)</FormLabel>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => {
                setExternalLink(e.target.value);
                if (linkError) setLinkError("");
              }}
              placeholder="YouTube, Instagram, or website link"
              className="w-full rounded-xl border border-[#d9d7e3] bg-white px-4 py-3 text-sm text-[#131b2e] outline-none transition placeholder:text-[#a6a4b1] focus:border-[#3525cd] focus:ring-4 focus:ring-[#3525cd]/10"
            />
            {linkError ? <p className="mt-2 text-xs font-semibold text-[#ba1a1a]">{linkError}</p> : null}
            <FieldHelp>
              We don't support direct video uploads yet — paste a YouTube or Instagram link if you'd like to show video or motion work.
            </FieldHelp>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#eeeaf6] pt-5">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave}>Save Project</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FreelancerOnboarding({ session, onExit } = {}) {
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState(initialForm);
  const [skills, setSkills] = useState([]);

  const [services, setServices] = useState([]);

  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [experience, setExperience] = useState(initialExperience);
  const [education, setEducation] = useState(initialEducation);
  const [certifications, setCertifications] = useState(initialCertifications);

  const [links, setLinks] = useState([]);

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [modalProject, setModalProject] = useState(undefined);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const userId = session?.user?.id;
  const storageKey = draftKey(userId, "freelancer");

  const profileCompletion = useMemo(() => {
    const fields = [
      form.fullName,
      form.title,
      form.location,
      form.shortIntro,
      form.category,
      form.specialization,
      form.experienceYears,
      form.about,
      form.availability,
    ];
    const filledFields = fields.filter((value) => String(value || "").trim()).length;
    const fieldScore = (filledFields / fields.length) * 55;
    const skillsScore = Math.min(skills.length / 4, 1) * 15;
    const servicesScore = Math.min(services.length / 2, 1) * 10;
    const portfolioScore = Math.min(portfolio.length / 2, 1) * 10;
    const experienceScore = Math.min(experience.length / 1, 1) * 5;
    const linksScore = links.length ? 5 : 0;

    return Math.round(fieldScore + skillsScore + servicesScore + portfolioScore + experienceScore + linksScore);
  }, [form, skills, services, portfolio, experience, links]);

  useEffect(() => {
    const loadSavedProfile = async () => {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.currentStep) setCurrentStep(draft.currentStep);
          if (draft.form) setForm(draft.form);
          if (draft.skills) setSkills(draft.skills);
          if (draft.services) setServices(draft.services);
          if (draft.portfolio) setPortfolio(draft.portfolio);
          if (draft.experience) setExperience(draft.experience);
          if (draft.education) setEducation(draft.education);
          if (draft.certifications) setCertifications(draft.certifications);
          if (draft.links) setLinks(draft.links);
        } catch (error) {
          console.error("Unable to restore saved draft:", error);
        }
      }

      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profile) {
        setForm((prev) => ({ ...prev, fullName: profile.full_name || "", title: profile.title || "", location: profile.location || "", shortIntro: profile.short_intro || "", category: profile.category || "", specialization: profile.specialization || "", experienceYears: profile.experience_years || "", about: profile.about || "", availability: profile.availability || "" }));
        if (Array.isArray(profile.links)) setLinks(profile.links);
        if (profile.onboarding_step) setCurrentStep(profile.onboarding_step);
      }

      const { data: skillsData } = await supabase.from("freelancer_skills").select("skill_name").eq("user_id", user.id);
      if (skillsData) setSkills(skillsData.map((item) => item.skill_name));

      const { data: servicesData } = await supabase.from("services").select("id, name, description, starting_price, delivery").eq("user_id", user.id);
      if (servicesData) setServices(servicesData.map((item) => ({ id: item.id, name: item.name, description: item.description, startingPrice: item.starting_price, delivery: item.delivery })));

      const { data: experienceData } = await supabase.from("experiences").select("id, role, company, start_date, end_date, description").eq("user_id", user.id);
      if (experienceData) setExperience(experienceData.map((item) => ({ id: item.id, role: item.role, company: item.company, start: item.start_date, end: item.end_date, description: item.description })));
    };

    loadSavedProfile();
  }, []);

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveDraft = () => {
    const payload = {
      currentStep,
      form,
      skills,
      services,
      portfolio,
      experience,
      education,
      certifications,
      links,
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);

    syncProgressToSupabase(currentStep, false);
  };

  const handleSkip = () => {
    saveDraft();
    setOnboardingSkipped(userId, true);
    onExit?.();
  };

  const saveProfileToSupabase = async () => {
    if (!supabase) {
      alert("Supabase is not configured. Please add your Supabase environment variables.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please log in first!");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      role: "freelancer",
      full_name: form.fullName,
      title: form.title,
      location: form.location,
      short_intro: form.shortIntro,
      category: form.category,
      specialization: form.specialization,
      experience_years: form.experienceYears,
      about: form.about,
      availability: form.availability,
      links,
      onboarding_step: 8,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile save error:", profileError);
      alert(`Unable to save profile: ${profileError.message}`);
      return;
    }

    const { error: skillsDeleteError } = await supabase
      .from("freelancer_skills")
      .delete()
      .eq("user_id", user.id);
    if (skillsDeleteError) {
      console.error("Skills delete error:", skillsDeleteError);
      alert(`Unable to save skills: ${skillsDeleteError.message}`);
      return;
    }

    if (skills.length > 0) {
      const { error: skillsError } = await supabase.from("freelancer_skills").insert(
        skills.map((skill) => ({ user_id: user.id, skill_name: skill }))
      );
      if (skillsError) {
        console.error("Skills save error:", skillsError);
        alert(`Unable to save skills: ${skillsError.message}`);
        return;
      }
    }

    const { error: servicesDeleteError } = await supabase
      .from("services")
      .delete()
      .eq("user_id", user.id);
    if (servicesDeleteError) {
      console.error("Services delete error:", servicesDeleteError);
      alert(`Unable to save services: ${servicesDeleteError.message}`);
      return;
    }

    if (services.length > 0) {
      const { error: servicesError } = await supabase.from("services").insert(
        services.map((service) => ({
          user_id: user.id,
          name: service.name,
          description: service.description,
          starting_price: service.startingPrice,
          delivery: service.delivery,
        }))
      );
      if (servicesError) {
        console.error("Services save error:", servicesError);
        alert(`Unable to save services: ${servicesError.message}`);
        return;
      }
    }

  };

  const syncProgressToSupabase = async (stepToSave = currentStep, completed = false) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, role: "freelancer", full_name: form.fullName, title: form.title, location: form.location, short_intro: form.shortIntro, category: form.category, specialization: form.specialization, experience_years: form.experienceYears, about: form.about, availability: form.availability, links, onboarding_step: stepToSave, profile_completed: completed, updated_at: new Date().toISOString() });
      if (profileError) throw profileError;
      if (stepToSave === 4) {
        const { error } = await supabase.from("freelancer_skills").delete().eq("user_id", user.id);
        if (error) throw error;
        if (skills.length) { const { error: insertError } = await supabase.from("freelancer_skills").insert(skills.map((skill) => ({ user_id: user.id, skill_name: skill }))); if (insertError) throw insertError; }
        const { error: serviceDeleteError } = await supabase.from("services").delete().eq("user_id", user.id);
        if (serviceDeleteError) throw serviceDeleteError;
        if (services.length) { const { error: serviceError } = await supabase.from("services").insert(services.map((s) => ({ user_id: user.id, name: s.name, description: s.description, starting_price: s.startingPrice, delivery: s.delivery }))); if (serviceError) throw serviceError; }
      }
      if (stepToSave === 6) {
        const { error } = await supabase.from("experiences").delete().eq("user_id", user.id);
        if (error) throw error;
        if (experience.length) { const { error: insertError } = await supabase.from("experiences").insert(experience.map((exp) => ({ user_id: user.id, role: exp.role, company: exp.company, start_date: exp.start, end_date: exp.end, description: exp.description }))); if (insertError) throw insertError; }
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (error) { console.error("Auto-save failed:", error); }
  };

  const goNext = async () => {
    if (currentStep < 8) {
      await syncProgressToSupabase(currentStep);
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInformation
            form={form}
            updateField={updateField}
            profilePhoto={profilePhoto}
            setProfilePhoto={setProfilePhoto}
          />
        );

      case 2:
        return (
          <ProfessionalDetails
            form={form}
            updateField={updateField}
            skills={skills}
            setSkills={setSkills}
          />
        );

      case 3:
        return <AboutYou form={form} updateField={updateField} />;

      case 4:
        return (
          <SkillsServices
            skills={skills}
            setSkills={setSkills}
            services={services}
            setServices={setServices}
          />
        );

      case 5:
        return (
          <Portfolio
            portfolio={portfolio}
            setPortfolio={setPortfolio}
            onOpenProjectModal={(project) => setModalProject(project)}
          />
        );

      case 6:
        return (
          <Experience
            experience={experience}
            setExperience={setExperience}
            education={education}
            setEducation={setEducation}
            certifications={certifications}
            setCertifications={setCertifications}
          />
        );

      case 7:
        return <Links links={links} setLinks={setLinks} />;

      case 8:
        return (
          <ProfilePreview
            form={form}
            skills={skills}
            services={services}
            portfolio={portfolio}
            profilePhoto={profilePhoto}
            links={links}
          />
        );

      default:
        return null;
    }
  };

  const handlePortfolioSave = (project) => {
    setPortfolio((prev) => {
      const exists = prev.some((item) => item.id === project.id);

      if (exists) {
        return prev.map((item) =>
          item.id === project.id ? project : item
        );
      }

      return [...prev, project];
    });

    setModalProject(undefined);
  };

  return (
    <>
      {/* Material Symbols font used by this one-file component */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200');
        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-[#faf8ff] text-[#131b2e]">
        {/* Desktop + Mobile top bar */}
        <header className="sticky top-0 z-50 border-b border-[#dedce8] bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div>
                <div className="text-lg font-extrabold tracking-tight text-[#3525cd]">
                  Ferrylancer
                </div>
                <div className="hidden text-[10px] text-[#777587] sm:block">
                  Freelancer profile setup
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {saved ? (
                <div className="hidden items-center gap-1.5 text-xs font-semibold text-[#08753d] sm:flex">
                  <Icon className="text-[17px]">check_circle</Icon>
                  Saved
                </div>
              ) : null}

              <button
                type="button"
                onClick={saveDraft}
                className="rounded-xl px-2.5 py-2 text-xs font-semibold text-[#555460] transition hover:bg-[#f3f2f7] sm:px-3"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className="rounded-xl border border-[#d9d7e3] px-2.5 py-2 text-xs font-semibold text-[#131b2e] transition hover:bg-[#f3f2f7] sm:px-3"
                title="Skip for now — you can finish this anytime from your dashboard"
              >
                Skip for now
              </button>
            </div>
          </div>
        </header>

        <MobileStepHeader currentStep={currentStep} setStep={setCurrentStep} />

        <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1500px]">
          <Stepper
            currentStep={currentStep}
            setStep={setCurrentStep}
            completion={profileCompletion}
          />

          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-[1050px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-12">
              {renderStep()}
            </div>
          </main>
        </div>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dedce8] bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1050px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
            <div className="hidden items-center gap-2 text-xs text-[#777587] sm:flex">
              <span>
                Step {currentStep} of 8
              </span>

              <span>•</span>

              <span>
                {STEPS[currentStep - 1].title}
              </span>
            </div>

            <div className="ml-auto flex w-full gap-2 sm:w-auto">
              {currentStep > 1 ? (
                <SecondaryButton
                  onClick={goBack}
                  className="flex-1 px-4 py-2.5 sm:flex-none"
                >
                  <Icon className="text-[18px]">arrow_back</Icon>
                  Back
                </SecondaryButton>
              ) : null}

              <SecondaryButton
                onClick={saveDraft}
                className="hidden px-4 py-2.5 sm:inline-flex"
              >
                <Icon className="text-[18px]">draft</Icon>
                Draft
              </SecondaryButton>

              {currentStep < 8 ? (
                <PrimaryButton
                  onClick={goNext}
                  className="flex-1 px-5 py-2.5 sm:flex-none"
                >
                  Continue
                  <Icon className="text-[18px]">arrow_forward</Icon>
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  disabled={publishing}
                  onClick={async () => {
                    setPublishing(true);
                    await saveProfileToSupabase();
                    setOnboardingSkipped(userId, false);
                    setPublishing(false);
                    onExit?.();
                  }}
                  className="flex-1 px-5 py-2.5 sm:flex-none"
                >
                  {publishing ? "Publishing..." : "Publish Profile"}
                  <Icon className="text-[18px]">publish</Icon>
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>

        {modalProject !== undefined ? (
          <PortfolioModal
            project={modalProject}
            onClose={() => setModalProject(undefined)}
            onSave={handlePortfolioSave}
          />
        ) : null}
      </div>
    </>
  );
}
