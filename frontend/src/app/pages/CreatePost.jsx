import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUpload } from "../../lib/apiClient";
import { compressMultipleImages } from "../../lib/imageCompressor";
import { supabase } from "../../lib/supabaseClient";
import { Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function CreatePost({ session, profile }) {
  const navigate = useNavigate();
  const isClient = profile?.role === "client";
  const [mode, setMode] = useState(isClient ? "project" : "post");
  const [content, setContent] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]); // [{ file, url }]
  const [externalLink, setExternalLink] = useState("");
  const [posting, setPosting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPhotos = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() || (mode === "project" && (!projectTitle.trim() || !budget.trim() || !estimatedTime.trim() || !deadline || !applicationDeadline))) return;
    setPosting(true);
    setError("");
    setUploadStatus("");

    try {
      if (supabase && session?.user?.id) {
        let uploadedUrls = [];

        if (selectedPhotos.length > 0 && mode !== "project") {
          setUploadStatus(`Optimizing ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? "s" : ""}...`);
          const rawFiles = selectedPhotos.map((p) => p.file).filter(Boolean);
          const compressedFiles = await compressMultipleImages(rawFiles);

          setUploadStatus(`Uploading ${compressedFiles.length} photo${compressedFiles.length > 1 ? "s" : ""}...`);
          uploadedUrls = await Promise.all(
            compressedFiles.map(async (file, idx) => {
              try {
                const res = await apiUpload(file, "post-image");
                return res?.url;
              } catch (apiErr) {
                console.warn(`Backend upload failed for image #${idx + 1}, falling back to direct Supabase Storage:`, apiErr);
                const fileExt = file.name?.split(".").pop() || "webp";
                const fileName = `${session.user.id}/${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                const { error: storageError } = await supabase.storage
                  .from("post-images")
                  .upload(fileName, file, { contentType: file.type || "image/webp", upsert: true });

                if (storageError) throw new Error(storageError.message || apiErr.message);
                const { data: publicUrlData } = supabase.storage.from("post-images").getPublicUrl(fileName);
                return publicUrlData?.publicUrl;
              }
            })
          );
          uploadedUrls = uploadedUrls.filter(Boolean);
        }

        const payload = mode === "project"
          ? {
              client_id: session.user.id,
              title: projectTitle.trim(),
              description: content.trim(),
              budget: `NPR ${budget.trim()}`,
              estimated_time: estimatedTime.trim(),
              deadline,
              application_deadline: applicationDeadline,
              tags: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
              status: "Open",
            }
          : {
              author_id: session.user.id,
              content: content.trim(),
              image: uploadedUrls[0] || null,
              images: uploadedUrls,
              external_link: externalLink.trim() || null,
              type: "post",
            };

        let { error } = await supabase.from(mode === "project" ? "projects" : "posts").insert(payload);
        if (error && mode !== "project" && /images.*schema cache|column.*images/i.test(`${error?.message || ""} ${error?.details || ""}`)) {
          const { images: _ignored, ...fallbackPayload } = payload;
          const retry = await supabase.from("posts").insert(fallbackPayload);
          if (retry.error) throw retry.error;
        } else if (error) {
          throw error;
        }
      }
      navigate("/app");
    } catch (err) {
      console.error(err);
      const missingSchemaField = /estimated_time|application_deadline|column .* does not exist|schema cache/i.test(`${err?.message || ""} ${err?.details || ""}`);
      setError(
        missingSchemaField
          ? "Supabase is missing the latest project fields. Open supabase/schema.sql in Supabase SQL Editor, run the full script, then refresh this page."
          : err?.message || "Unable to post right now. Check your Supabase connection and try again."
      );
    } finally {
      setPosting(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold text-[#050505]">{isClient && mode === "project" ? "Post a Project" : "Create Post"}</h1>

      {isClient ? (
        <div className="mb-4 flex gap-1 rounded-lg border border-[#D8DADF] bg-white p-1">
          <button
            onClick={() => setMode("post")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "post" ? "bg-[#1877F2] text-white" : "text-[#65676B]"}`}
          >
            Share an Update
          </button>
          <button
            onClick={() => setMode("project")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "project" ? "bg-[#1877F2] text-white" : "text-[#65676B]"}`}
          >
            Post a Project
          </button>
        </div>
      ) : null}

      <Card className="p-5">
        {mode === "project" ? (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-[#050505]">Project title</span>
              <input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. Website redesign for a restaurant" className="w-full rounded-lg border border-[#D8DADF] px-3.5 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-[#050505]">Budget (NPR)</span>
              <input value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^0-9,]/g, ""))} inputMode="numeric" placeholder="e.g. 50000" className="w-full rounded-lg border border-[#D8DADF] px-3.5 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-[#050505]">Estimated project time</span>
              <input value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="e.g. 2 weeks" className="w-full rounded-lg border border-[#D8DADF] px-3.5 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-[#050505]">Deadline</span>
              <input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" className="w-full rounded-lg border border-[#D8DADF] px-3.5 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20" />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold text-[#050505]">Application closes</span>
              <input value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} min={new Date().toISOString().slice(0, 10)} type="date" className="w-full rounded-lg border border-[#D8DADF] px-3.5 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-[#050505]">Skills needed <span className="font-normal text-[#65676B]">(comma separated)</span></span>
              <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, UI/UX, Tailwind CSS" className="w-full rounded-lg border border-[#D8DADF] px-3.5 py-2.5 text-sm outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20" />
            </label>
          </div>
        ) : null}

        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            mode === "project"
              ? "Describe the project: scope, deliverables, budget, and timeline..."
              : "Share an update, a win, or something you're working on..."
          }
          className="w-full resize-none border-none p-0 text-base leading-6 text-[#050505] outline-none placeholder:text-[#8A8D91]"
        />

        {/* Facebook-style Multi-Photo Previews */}
        {selectedPhotos.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#D8DADF] bg-[#F0F2F5] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-[#050505]">
                {selectedPhotos.length} Photo{selectedPhotos.length > 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 text-xs font-semibold text-[#1877F2] hover:underline"
              >
                <Icon className="text-[16px]">add_photo_alternate</Icon>
                Add more
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selectedPhotos.map((photo, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-[#D8DADF] bg-black/5">
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition hover:bg-black/90"
                    title="Remove photo"
                  >
                    <Icon className="text-[14px]">close</Icon>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3">
          <input
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="Optional: add a YouTube/Instagram link for video, or any other link"
            className="w-full rounded-lg border border-[#D8DADF] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#8A8D91] focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#E4E6EB] pt-3">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-sm font-semibold text-[#65676B] hover:text-[#1877F2]">
            <Icon className="text-[#45BD62]">imagesmode</Icon>
            {selectedPhotos.length > 0 ? "Add More Photos" : "Add Photos"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />
        </div>
      </Card>

      {uploadStatus ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#E7F3FF] px-3 py-2 text-sm font-semibold text-[#1877F2]">
          <Icon className="animate-spin text-lg">progress_activity</Icon>
          {uploadStatus}
        </p>
      ) : null}

      {error ? <p className="mt-3 rounded-lg border border-[#f3b5b5] bg-[#fff1f1] px-3 py-2 text-sm font-semibold text-[#ba1a1a]">{error}</p> : null}

      <div className="mt-4 flex justify-end gap-2">
        <SecondaryButton onClick={() => navigate(-1)}>Cancel</SecondaryButton>
        <PrimaryButton onClick={handleSubmit} disabled={posting || !content.trim() || (mode === "project" && (!projectTitle.trim() || !budget.trim() || !estimatedTime.trim() || !deadline || !applicationDeadline))}>
          {posting ? "Posting..." : mode === "project" ? "Post Project" : "Post"}
        </PrimaryButton>
      </div>
    </div>
  );
}
