function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(String(value ?? "").trim());
}

export function getProfileCompletion(profile) {
  if (!profile) return 0;

  const fields = profile.role === "client"
    ? [
        profile.full_name,
        profile.title,
        profile.location,
        profile.company_name,
        profile.industry,
        profile.about,
        profile.hiring_categories,
        profile.links,
        profile.avatar_url,
      ]
    : [
        profile.full_name,
        profile.title,
        profile.location,
        profile.short_intro,
        profile.category,
        profile.specialization,
        profile.experience_years,
        profile.about,
        profile.availability,
        profile.skills,
        profile.services,
        profile.portfolio,
        profile.experience,
        profile.education,
        profile.certifications,
        profile.links,
        profile.avatar_url,
        profile.cover_url,
      ];

  return Math.round((fields.filter(hasValue).length / fields.length) * 100);
}
