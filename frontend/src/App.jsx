import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Problem from "./components/Problem";
import Marketplace from "./components/Marketplace";
import HowItWorks from "./components/HowItWorks";
import ProfilePreview from "./components/ProfilePreview";
import Features from "./components/Features";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import FreelancerOnboarding from "./components/FreelancerOnboarding";
import ClientOnboarding from "./components/ClientOnboarding";
import { supabase } from "./lib/supabaseClient";
import { isOnboardingSkipped } from "./lib/onboardingStatus";

import AppShell from "./app/AppShell";
import Feed from "./app/pages/Feed";
import Discover from "./app/pages/Discover";
import MyProjects from "./app/pages/MyProjects";
import ProjectDetails from "./app/pages/ProjectDetails";
import ProjectWorkspace from "./app/pages/ProjectWorkspace";
import MyProposals from "./app/pages/MyProposals";
import SubmitProposal from "./app/pages/SubmitProposal";
import Messages from "./app/pages/Messages";
import Notifications from "./app/pages/Notifications";
import CreatePost from "./app/pages/CreatePost";
import Earnings from "./app/pages/Earnings";
import Profile from "./app/pages/Profile";
import ProfilePosts from "./app/pages/ProfilePosts";
import Network from "./app/pages/Network";
import ProjectResponses from "./app/pages/ProjectResponses";

function getUserRole(session) {
  const raw = session?.user?.user_metadata?.role ?? session?.user?.app_metadata?.role ?? null;
  if (raw === "talent" || raw === "freelancer") return "freelancer";
  if (raw === "client") return "client";
  return null;
}

function LandingPage({ session, onAuthClick }) {
  return (
    <>
      <Navbar session={session} onAuthClick={onAuthClick} />
      <main>
        <Hero onAuthClick={onAuthClick} />
        <Problem />
        <Marketplace />
        <HowItWorks />
        <ProfilePreview />
        <Features />
        <CTA onAuthClick={onAuthClick} />
      </main>
      <Footer />
    </>
  );
}

function App() {
  const [authRequest, setAuthRequest] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setSessionChecked(true);
      return undefined;
    }

    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (alive) {
        setSession(data.session);
        setSessionChecked(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionChecked(true);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !session?.user?.id) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    setProfile(data || null);
    setProfileLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const openAuth = (mode = "login", role = "client") => setAuthRequest({ mode, role });

  const metadataRole = getUserRole(session);
  const effectiveRole = profile?.role || metadataRole || "freelancer";

  if (!sessionChecked) return null;

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            session ? (
              <Navigate to="/app" replace />
            ) : (
              <LandingPage session={session} onAuthClick={openAuth} />
            )
          }
        />

        <Route
          path="/app"
          element={session ? <AppShell session={session} profile={profile} /> : <Navigate to="/" replace />}
        >
          <Route
            index
            element={
              <HomeGate session={session} profile={profile} profileLoading={profileLoading}>
                <Feed profile={profile} session={session} />
              </HomeGate>
            }
          />
          <Route path="discover" element={<Discover session={session} profile={profile} />} />
          <Route path="projects" element={<MyProjects profile={profile} session={session} />} />
          <Route path="projects/:id" element={<ProjectDetails session={session} />} />
          <Route path="projects/:id/responses" element={<ProjectResponses session={session} />} />
          <Route path="workspace/:id" element={<ProjectWorkspace />} />
          <Route path="proposals" element={<MyProposals session={session} />} />
          <Route path="proposals/new/:projectId" element={<SubmitProposal session={session} />} />
          <Route path="messages" element={<Messages session={session} />} />
          <Route path="notifications" element={<Notifications session={session} />} />
          <Route path="network" element={<Network session={session} profile={profile} />} />
          <Route path="create" element={<CreatePost session={session} profile={profile} />} />
          <Route path="earnings" element={<Earnings session={session} />} />
          <Route path="profile" element={<Profile session={session} profile={profile} />} />
          <Route path="profile/posts" element={<ProfilePosts session={session} profile={profile} />} />
          <Route path="profile/:id/posts" element={<ProfilePosts session={session} profile={profile} />} />
          <Route path="profile/:id" element={<Profile session={session} profile={profile} />} />
          <Route
            path="onboarding"
            element={<OnboardingRouter session={session} role={effectiveRole} onDone={refreshProfile} />}
          />
        </Route>

        <Route path="*" element={<Navigate to={session ? "/app" : "/"} replace />} />
      </Routes>

      {authRequest ? (
        <AuthModal mode={authRequest.mode} role={authRequest.role} onClose={() => setAuthRequest(null)} />
      ) : null}
    </>
  );
}

// Decides, on landing at /app, whether to show the feed or (for a first-time /
// not-yet-skipped user) drop them straight into onboarding. Once they hit
// "Skip for now" or "Publish Profile" this no longer redirects them.
function HomeGate({ session, profile, profileLoading, children }) {
  const userId = session?.user?.id;
  if (!profileLoading && profile && !profile.profile_completed && !isOnboardingSkipped(userId)) {
    return <Navigate to="/app/onboarding" replace />;
  }
  return children;
}

function OnboardingRouter({ session, role, onDone }) {
  const navigate = useNavigate();
  const handleExit = async () => {
    await onDone?.();
    navigate("/app");
  };

  if (role === "client") {
    return <ClientOnboarding session={session} onExit={handleExit} />;
  }
  return <FreelancerOnboarding session={session} onExit={handleExit} />;
}

export default App;
