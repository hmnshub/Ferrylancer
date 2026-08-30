import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { draftKey, setOnboardingSkipped } from "../lib/onboardingStatus";
import {
  Card,
  Chip,
  DynamicLinks,
  FieldHelp,
  FormLabel,
  Icon,
  MobileStepHeader,
  OnboardingBottomBar,
  OnboardingTopBar,
  PhotoUpload,
  SectionHeading,
  SelectInput,
  Stepper,
  TextArea,
  TextInput,
} from "./onboarding/shared";

const STEPS = [
  { id: 1, title: "Basic Information", icon: "person" },
  { id: 2, title: "Business Details", icon: "business_center" },
  { id: 3, title: "About Your Business", icon: "edit_note" },
  { id: 4, title: "Hiring Needs", icon: "groups" },
  { id: 5, title: "Links", icon: "link" },
  { id: 6, title: "Profile Preview", icon: "visibility" },
];

const INDUSTRIES = [
  "Select an industry",
  "Technology / Software",
  "Healthcare",
  "E-commerce / Retail",
  "Finance & Fintech",
  "Media & Entertainment",
  "Education",
  "Manufacturing",
  "Travel & Hospitality",
  "Real Estate",
  "Non-profit",
  "Other",
];

const COMPANY_SIZES = ["Just me", "2-10 employees", "11-50 employees", "51-200 employees", "200+ employees"];

const HIRING_FREQUENCIES = ["One-time project", "A few times a year", "Monthly", "Ongoing / building a team"];

const SUGGESTED_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Graphic Design",
  "Video Editing",
  "Content Writing",
  "Digital Marketing",
  "Data Analysis",
  "AI / Machine Learning",
  "DevOps & Cloud",
];

const BUDGET_RANGES = [
  "Under NPR 20,000",
  "NPR 20,000 - 50,000",
  "NPR 50,000 - 150,000",
  "NPR 150,000+",
  "Prefer to discuss per project",
];

const initialForm = {
  fullName: "",
  contactTitle: "",
  location: "",
  companyName: "",
  industry: INDUSTRIES[0],
  companySize: COMPANY_SIZES[0],
  foundedYear: "",
  about: "",
  mission: "",
  hiringFrequency: HIRING_FREQUENCIES[0],
  budgetRange: BUDGET_RANGES[0],
};

export default function ClientOnboarding({ session, onExit }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [hiringCategories, setHiringCategories] = useState([]);
  const [links, setLinks] = useState([]);
  const [logo, setLogo] = useState(null);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const userId = session?.user?.id;
  const storageKey = draftKey(userId, "client");

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleCategory = (category) => {
    setHiringCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const completion = useMemo(() => {
    const fields = [
      form.fullName,
      form.contactTitle,
      form.location,
      form.companyName,
      form.industry !== INDUSTRIES[0] ? form.industry : "",
      form.about,
    ];
    const filledFields = fields.filter((v) => String(v || "").trim()).length;
    const fieldScore = (filledFields / fields.length) * 60;
    const categoryScore = Math.min(hiringCategories.length / 3, 1) * 20;
    const linksScore = links.length ? 10 : 0;
    const logoScore = logo ? 10 : 0;
    return Math.round(fieldScore + categoryScore + linksScore + logoScore);
  }, [form, hiringCategories, links, logo]);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft.currentStep) setCurrentStep(draft.currentStep);
          if (draft.form) setForm(draft.form);
          if (draft.hiringCategories) setHiringCategories(draft.hiringCategories);
          if (draft.links) setLinks(draft.links);
        }
      } catch (error) {
        console.error("Unable to restore client draft:", error);
      }

      if (!supabase || !userId) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (profile) {
        setForm((prev) => ({
          ...prev,
          fullName: profile.full_name || prev.fullName,
          contactTitle: profile.title || prev.contactTitle,
          location: profile.location || prev.location,
          companyName: profile.company_name || prev.companyName,
          industry: profile.industry || prev.industry,
          companySize: profile.company_size || prev.companySize,
          foundedYear: profile.founded_year || prev.foundedYear,
          about: profile.about || prev.about,
          mission: profile.mission || prev.mission,
          hiringFrequency: profile.hiring_frequency || prev.hiringFrequency,
          budgetRange: profile.budget_range || prev.budgetRange,
        }));
        if (Array.isArray(profile.hiring_categories)) setHiringCategories(profile.hiring_categories);
        if (Array.isArray(profile.links)) setLinks(profile.links);
        if (profile.onboarding_step) setCurrentStep(profile.onboarding_step);
      }
    };
    restore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const syncStepToSupabase = async (step, completed) => {
    if (!supabase || !userId) return;
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        role: "client",
        full_name: form.fullName,
        title: form.contactTitle,
        location: form.location,
        company_name: form.companyName,
        industry: form.industry,
        company_size: form.companySize,
        founded_year: form.foundedYear,
        about: form.about,
        mission: form.mission,
        hiring_frequency: form.hiringFrequency,
        budget_range: form.budgetRange,
        hiring_categories: hiringCategories,
        links,
        onboarding_step: step,
        profile_completed: completed,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const saveDraft = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ currentStep, form, hiringCategories, links }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Unable to save client draft:", error);
    }
    syncStepToSupabase(currentStep, false);
  };

  const goNext = async () => {
    if (currentStep < STEPS.length) {
      await syncStepToSupabase(currentStep, false);
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSkip = async () => {
    saveDraft();
    setOnboardingSkipped(userId, true);
    onExit?.();
  };

  const handlePublish = async () => {
    setPublishing(true);
    await syncStepToSupabase(STEPS.length, true);
    setOnboardingSkipped(userId, false);
    setPublishing(false);
    onExit?.();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformation form={form} updateField={updateField} logo={logo} setLogo={setLogo} />;
      case 2:
        return <BusinessDetails form={form} updateField={updateField} />;
      case 3:
        return <AboutBusiness form={form} updateField={updateField} />;
      case 4:
        return (
          <HiringNeeds form={form} updateField={updateField} hiringCategories={hiringCategories} toggleCategory={toggleCategory} />
        );
      case 5:
        return <Links links={links} setLinks={setLinks} />;
      case 6:
        return <ClientPreview form={form} hiringCategories={hiringCategories} links={links} logo={logo} />;
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0..200');
        body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      `}</style>

      <div className="min-h-screen bg-[#faf8ff] text-[#131b2e]">
        <OnboardingTopBar brand="Ferrylance" subtitle="Business profile setup" saved={saved} onSkip={handleSkip} onSaveDraft={saveDraft} />

        <MobileStepHeader steps={STEPS} currentStep={currentStep} setStep={setCurrentStep} />

        <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1500px]">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            setStep={setCurrentStep}
            completion={completion}
            brand="Ferrylance"
            subtitle="Business setup"
          />

          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-[1050px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-12">{renderStep()}</div>
          </main>
        </div>

        <OnboardingBottomBar
          steps={STEPS}
          currentStep={currentStep}
          onBack={goBack}
          onNext={goNext}
          onSaveDraft={saveDraft}
          onPublish={handlePublish}
          isLastStep={currentStep === STEPS.length}
          publishing={publishing}
        />
      </div>
    </>
  );
}

function BasicInformation({ form, updateField, logo, setLogo }) {
  return (
    <div>
      <SectionHeading eyebrow="Step 1" title="Basic Information" description="Tell freelancers who they'll be working with." />
      <div className="grid gap-7">
        <PhotoUpload
          label="Your Photo"
          help="A face freelancers can trust — use a clear headshot. JPG, PNG or WebP up to 5MB."
          photo={logo}
          setPhoto={setLogo}
          shape="round"
        />
        <Card className="grid gap-5 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput label="Full Name" required value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Enter your full name" />
            <TextInput
              label="Your Role at the Company"
              required
              value={form.contactTitle}
              onChange={(e) => updateField("contactTitle", e.target.value)}
              placeholder="e.g. Founder & CEO, HR Manager"
            />
          </div>
          <TextInput label="Location" required value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="City, Country" />
        </Card>
      </div>
    </div>
  );
}

function BusinessDetails({ form, updateField }) {
  return (
    <div>
      <SectionHeading eyebrow="Step 2" title="Business Details" description="Help freelancers understand the company they'd be working with." />
      <Card className="grid gap-5 p-5 sm:p-6">
        <TextInput label="Company / Business Name" required value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="e.g. CovianLab" />
        <div className="grid gap-5 md:grid-cols-2">
          <SelectInput label="Industry" value={form.industry} onChange={(e) => updateField("industry", e.target.value)} options={INDUSTRIES} />
          <SelectInput label="Company Size" value={form.companySize} onChange={(e) => updateField("companySize", e.target.value)} options={COMPANY_SIZES} />
        </div>
        <TextInput label="Founded Year" optional value={form.foundedYear} onChange={(e) => updateField("foundedYear", e.target.value)} placeholder="e.g. 2021" />
      </Card>
    </div>
  );
}

function AboutBusiness({ form, updateField }) {
  return (
    <div>
      <SectionHeading eyebrow="Step 3" title="About Your Business" description="Give freelancers context on what you do and why it matters." />
      <Card className="grid gap-5 p-5 sm:p-6">
        <TextArea label="What does your business do?" value={form.about} onChange={(e) => updateField("about", e.target.value)} rows={6} maxLength={600} placeholder="Describe your business, products, or services..." />
        <TextArea label="Mission / What you're building toward" value={form.mission} onChange={(e) => updateField("mission", e.target.value)} rows={4} maxLength={300} placeholder="Optional — helps freelancers connect with your goals" />
      </Card>
    </div>
  );
}

function HiringNeeds({ form, updateField, hiringCategories, toggleCategory }) {
  return (
    <div>
      <SectionHeading eyebrow="Step 4" title="Hiring Needs" description="What kind of talent do you usually look for?" />
      <div className="grid gap-5">
        <Card className="p-5 sm:p-6">
          <FormLabel>What roles do you typically hire for?</FormLabel>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_CATEGORIES.map((category) => {
              const active = hiringCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                    active ? "border-[#3525cd] bg-[#3525cd] text-white" : "border-[#d9d7e3] bg-white text-[#555460] hover:border-[#3525cd] hover:text-[#3525cd]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          {hiringCategories.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {hiringCategories.map((c) => (
                <Chip key={c} onRemove={() => toggleCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          ) : null}
          <FieldHelp>Select all that apply — this helps us recommend the right freelancers to you.</FieldHelp>
        </Card>

        <Card className="grid gap-5 p-5 sm:p-6">
          <SelectInput label="How often do you hire?" value={form.hiringFrequency} onChange={(e) => updateField("hiringFrequency", e.target.value)} options={HIRING_FREQUENCIES} />
          <SelectInput label="Typical Project Budget" value={form.budgetRange} onChange={(e) => updateField("budgetRange", e.target.value)} options={BUDGET_RANGES} />
        </Card>
      </div>
    </div>
  );
}

function Links({ links, setLinks }) {
  return (
    <div>
      <SectionHeading eyebrow="Step 5" title="Links" description="Add your company website, LinkedIn page, or any other relevant links." />
      <DynamicLinks links={links} setLinks={setLinks} />
    </div>
  );
}

function ClientPreview({ form, hiringCategories, links, logo }) {
  return (
    <div>
      <SectionHeading eyebrow="Step 6" title="Profile Preview" description="This is how freelancers will see your business profile." />
      <Card className="overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-r from-[#3525cd] to-[#6063ee]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#f1effb]">
              {logo?.url ? <img src={logo.url} alt="" className="h-full w-full object-cover" /> : <Icon className="text-[28px] text-[#3525cd]">business</Icon>}
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#131b2e]">{form.companyName || "Your Company"}</h2>
          <p className="text-sm text-[#777587]">
            {form.contactTitle || "Role"} · {form.fullName || "Your Name"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[#8c8b99]">
            <Icon className="text-[15px]">location_on</Icon>
            {form.location || "Location"}
          </p>

          {form.about ? <p className="mt-4 text-sm leading-6 text-[#464554]">{form.about}</p> : null}

          {hiringCategories.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {hiringCategories.map((c) => (
                <span key={c} className="rounded-full bg-[#f2f0fb] px-3 py-1 text-xs font-semibold text-[#3525cd]">
                  {c}
                </span>
              ))}
            </div>
          ) : null}

          {links.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {links.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-[#d9d7e3] px-3 py-1.5 text-xs font-semibold text-[#131b2e] hover:border-[#3525cd] hover:text-[#3525cd]">
                  <Icon className="text-[15px]">{link.icon}</Icon>
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <p className="mt-4 text-xs leading-5 text-[#8c8b99]">Ready to publish? Freelancers will be able to see this profile and your posted projects.</p>
    </div>
  );
}
