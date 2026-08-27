// Small helpers around the "finish this later" onboarding UX.
//
// Behaviour we want:
//  - First time a user completes signup we drop them into the onboarding
//    wizard for their role.
//  - They can hit "Skip for now" at any point -> we remember that (per user)
//    so next time they log in they land on the main app instead of being
//    forced back into the wizard.
//  - The app shell always shows a "Finish your profile" banner/card while
//    profile_completed is false, with a button that reopens the wizard at
//    the exact step they left off on (onboarding_step, synced to Supabase
//    so it also works across devices).

const SKIP_PREFIX = "ferrylance_onboarding_skipped_";

export function skipKey(userId) {
  return `${SKIP_PREFIX}${userId || "anon"}`;
}

export function isOnboardingSkipped(userId) {
  if (!userId) return false;
  try {
    return window.localStorage.getItem(skipKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function setOnboardingSkipped(userId, skipped) {
  if (!userId) return;
  try {
    if (skipped) {
      window.localStorage.setItem(skipKey(userId), "1");
    } else {
      window.localStorage.removeItem(skipKey(userId));
    }
  } catch {
    // localStorage may be unavailable (private browsing, SSR, etc.) — non-fatal.
  }
}

export function draftKey(userId, role) {
  return `ferrylance_${role}_draft_${userId || "anon"}`;
}
