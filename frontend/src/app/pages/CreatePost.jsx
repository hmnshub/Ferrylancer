import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiUpload } from "../../lib/apiClient";
import { compressMultipleImages } from "../../lib/imageCompressor";
import { CROP_OPTIONS, closestCropOption, cropImageToAspect } from "../../lib/imageCropper";
import { supabase } from "../../lib/supabaseClient";
import { Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function CreatePost({ session, profile }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountRole = profile?.role || session?.user?.user_metadata?.role;
  const isClient = accountRole === "client";
  const requestedMode = searchParams.get("mode");
  const [mode] = useState(isClient && requestedMode !== "post" ? "project" : "post");
  const [content, setContent] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]); // [{ file, url, crop } ]
  const [singleCrop, setSingleCrop] = useState("auto");
  const [collageLayout, setCollageLayout] = useState("auto");
  const [photoCrops, setPhotoCrops] = useState({});
  const [selectedCropPhoto, setSelectedCropPhoto] = useState(0);
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
      crop: "auto",
    }));
    setSelectedPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getTileCrop = (index, count) => {
    if (count === 1) return singleCrop;
    if (photoCrops[index]) return photoCrops[index];
    if (collageLayout === "square") return "square";
    if (collageLayout === "portrait") return "portrait";
    if (count === 2 || count === 4) return "square";
    return index === 0 ? "portrait" : "square";
  };

  const getCropRatio = (id) => {
    if (id === "portrait") return 4 / 5;
    if (id === "landscape") return 1.91;
    return 1;
  };

  const handleSubmit = async () => {
    if (!content.trim() || (mode === "project" && (!projectTitle.trim() || !budget.trim() || !estimatedTime.trim() || !deadline || !applicationDeadline))) return;
    if (mode === "project" && !isClient) {
      setError("Only User accounts can post projects. Developers can showcase their work and browse available projects.");
      return;
    }
    setPosting(true);
    setError("");
    setUploadStatus("");

    try {
      if (supabase && session?.user?.id) {
        const role = profile?.role || (session.user.user_metadata?.role === "client" ? "client" : "freelancer");
        const { error: profileError } = await supabase.from("profiles").upsert(
          { id: session.user.id, role },
          { onConflict: "id", ignoreDuplicates: true }
        );
        if (profileError) throw profileError;

        let uploadedUrls = [];

        if (selectedPhotos.length > 0 && mode !== "project") {
          setUploadStatus(`Optimizing ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? "s" : ""}...`);
          const rawFiles = selectedPhotos.map((p) => p.file).filter(Boolean);
          const croppedFiles = await Promise.all(rawFiles.map(async (file, index) => {
            const cropId = getTileCrop(index, rawFiles.length);
            if (cropId === "auto") {
              const image = await new Promise((resolve, reject) => { const item = new Image(); const url = URL.createObjectURL(file); item.onload = () => { URL.revokeObjectURL(url); resolve(item); }; item.onerror = reject; item.src = url; });
              return cropImageToAspect(file, closestCropOption(image.width, image.height).ratio);
            }
            return cropImageToAspect(file, getCropRatio(cropId));
          }));
          const compressedFiles = await compressMultipleImages(croppedFiles);

          setUploadStatus(`Uploading ${compressedFiles.length} photo${compressedFiles.length > 1 ? "s" : ""}...`);
          uploadedUrls = await Promise.all(
            compressedFiles.map(async (file, idx) => {
              try {
                const res = await apiUpload(file, "post-image");
                return res?.url;
              } catch (apiErr) {
                // A 401 means the API rejected the current auth session. A
                // storage fallback cannot repair that and usually produces a
                // second, misleading RLS error in the browser console.
                if (apiErr?.status === 401) {
                  throw new Error("Your session expired. Please sign in again and retry the upload.");
                }
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
    <div className="mx-auto min-h-[calc(100vh-7rem)] max-w-[680px] py-2 sm:py-6">
      <div className="overflow-hidden rounded-3xl border border-[#D8DADF] bg-white shadow-[0_18px_50px_rgba(20,32,90,.12)]">
      <header className="flex items-center justify-between border-b border-[#EEF0F4] px-5 py-4 sm:px-7">
        <h1 className="text-xl font-bold tracking-tight text-[#050505]">{isClient && mode === "project" ? "Post a Project" : !isClient ? "Showcase Your Work" : "Create Post"}</h1>
        <button type="button" onClick={() => navigate(-1)} aria-label="Close create post" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F2F5] text-[#65676B] transition hover:bg-[#E4E6EB] hover:text-[#050505]"><Icon>close</Icon></button>
      </header>

      <Card className="rounded-none border-0 p-5 shadow-none sm:p-7">
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
              : !isClient
                ? "Show users what you can build — add a description, photos, or a portfolio link..."
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
            {selectedPhotos.length === 1 ? (
              <div className="space-y-3">
                <div className={`relative overflow-hidden rounded-lg border border-[#D8DADF] bg-black/5 ${singleCrop === "portrait" ? "aspect-[4/5]" : singleCrop === "landscape" ? "aspect-[1.91/1]" : "aspect-square"}`}>
                  <img src={selectedPhotos[0].url} alt="Selected photo" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => handleRemovePhoto(0)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white" title="Remove photo"><Icon className="text-[15px]">close</Icon></button>
                </div>
                <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-[#65676B]">Crop</span>{CROP_OPTIONS.map((option) => <button key={option.id} type="button" onClick={() => setSingleCrop(option.id)} className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${singleCrop === option.id ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]" : "border-[#D8DADF] text-[#65676B] hover:bg-white"}`}><Icon className="text-[15px]">{option.icon}</Icon>{option.label}</button>)}</div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`grid gap-1 overflow-hidden rounded-lg ${selectedPhotos.length === 3 && collageLayout === "auto" ? "grid-cols-2 grid-rows-2" : "grid-cols-2"}`}>
                  {selectedPhotos.map((photo, i) => <div key={i} style={{ aspectRatio: getCropRatio(getTileCrop(i, selectedPhotos.length)) }} className={`group relative min-h-24 overflow-hidden bg-black/5 ${selectedPhotos.length === 3 && i === 0 && collageLayout === "auto" ? "row-span-2" : ""}`}><img src={photo.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => handleRemovePhoto(i)} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-md"><Icon className="text-[15px]">close</Icon></button></div>)}
                </div>
                <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-[#65676B]">Arrange</span>{[{ id: "auto", label: "Balanced" }, { id: "square", label: "Square tiles" }, { id: "portrait", label: "Portrait tiles" }].map((option) => <button key={option.id} type="button" onClick={() => setCollageLayout(option.id)} className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold ${collageLayout === option.id ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]" : "border-[#D8DADF] text-[#65676B] hover:bg-white"}`}>{option.label}</button>)}</div>
                <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-[#65676B]">Crop</span>{selectedPhotos.map((_, index) => <button key={index} type="button" onClick={() => setSelectedCropPhoto(index)} className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${selectedCropPhoto === index ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]" : "border-[#D8DADF] text-[#65676B]"}`}>Photo {index + 1}</button>)}</div>
                <div className="flex flex-wrap gap-2">{CROP_OPTIONS.map((option) => <button key={option.id} type="button" onClick={() => setPhotoCrops((current) => ({ ...current, [selectedCropPhoto]: option.id }))} className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${(photoCrops[selectedCropPhoto] || getTileCrop(selectedCropPhoto, selectedPhotos.length)) === option.id ? "border-[#1877F2] bg-[#E7F3FF] text-[#1877F2]" : "border-[#D8DADF] text-[#65676B]"}`}><Icon className="text-[15px]">{option.icon}</Icon>{option.label}</button>)}</div>
                <p className="text-[11px] text-[#65676B]">Choose an arrangement, then choose a crop for each photo.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#D8DADF] px-3.5 py-2.5">
          <Icon className="text-[18px] text-[#8A8D91]">link</Icon>
          <input
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="Optional: add a YouTube/Instagram link for video, or any other link"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8A8D91]"
          />
        </div>

        <div className="mt-4 border-t border-[#E4E6EB] pt-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-sm font-semibold text-[#3C4043] transition hover:bg-[#F0F2F5]">
            <span className="flex items-center gap-2"><Icon className="text-[#45BD62]">imagesmode</Icon>{selectedPhotos.length > 0 ? "Add More Photos" : "Add Photos"}</span>
            <Icon className="text-[#8A8D91]">chevron_right</Icon>
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

      <div className="flex justify-end gap-2 border-t border-[#EEF0F4] bg-[#FCFDFE] px-5 py-4 sm:px-7">
        <SecondaryButton onClick={() => navigate(-1)} className="rounded-xl px-5">Cancel</SecondaryButton>
        <PrimaryButton onClick={handleSubmit} className="rounded-xl px-5" disabled={posting || !content.trim() || (mode === "project" && (!projectTitle.trim() || !budget.trim() || !estimatedTime.trim() || !deadline || !applicationDeadline))}>
          {posting ? "Posting..." : mode === "project" ? "Post Project" : !isClient ? "Showcase Work" : "Post"}
        </PrimaryButton>
      </div>
      </div>
    </div>
  );
}
