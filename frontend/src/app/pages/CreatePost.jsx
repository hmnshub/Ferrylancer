import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Card, Icon, PrimaryButton, SecondaryButton } from "../ui/primitives";

export default function CreatePost({ session, profile }) {
  const navigate = useNavigate();
  const isClient = profile?.role === "client";
  const [mode, setMode] = useState("post");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [externalLink, setExternalLink] = useState("");
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage({ file, url: URL.createObjectURL(file) });
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      if (supabase && session?.user?.id) {
        // Actual image upload (resize/compress) is delegated to the Node backend's
        // POST /api/uploads endpoint, which stores the optimized file in Supabase
        // Storage and returns a public URL to save here as `image`.
        const { error } = await supabase.from("posts").insert({
          author_id: session.user.id,
          content,
          external_link: externalLink || null,
          type: mode,
        });
        if (error) throw error;
      }
      navigate("/app");
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold text-[#0b1c30]">{isClient && mode === "project" ? "Post a Project" : "Create Post"}</h1>

      {isClient ? (
        <div className="mb-4 flex gap-1 rounded-lg border border-[#c7c4d7] bg-white p-1">
          <button
            onClick={() => setMode("post")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "post" ? "bg-[#4648d4] text-white" : "text-[#565e74]"}`}
          >
            Share an Update
          </button>
          <button
            onClick={() => setMode("project")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "project" ? "bg-[#4648d4] text-white" : "text-[#565e74]"}`}
          >
            Post a Project
          </button>
        </div>
      ) : null}

      <Card className="p-5">
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            mode === "project"
              ? "Describe the project: scope, deliverables, budget, and timeline..."
              : "Share an update, a win, or something you're working on..."
          }
          className="w-full resize-none border-none p-0 text-base leading-6 text-[#0b1c30] outline-none placeholder:text-[#767586]"
        />

        {image ? (
          <div className="relative mt-3 overflow-hidden rounded-lg border border-[#e5eeff]">
            <img src={image.url} alt="" className="max-h-72 w-full object-cover" />
            <button
              onClick={() => setImage(null)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <Icon className="text-[16px]">close</Icon>
            </button>
          </div>
        ) : null}

        <div className="mt-3">
          <input
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="Optional: add a YouTube/Instagram link for video, or any other link"
            className="w-full rounded-lg border border-[#c7c4d7] px-3.5 py-2.5 text-sm outline-none placeholder:text-[#a6a4b1] focus:border-[#4648d4]"
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#e5eeff] pt-3">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-sm font-semibold text-[#565e74] hover:text-[#4648d4]">
            <Icon>imagesmode</Icon>
            Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </div>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <SecondaryButton onClick={() => navigate(-1)}>Cancel</SecondaryButton>
        <PrimaryButton onClick={handleSubmit} disabled={posting || !content.trim()}>
          {posting ? "Posting..." : mode === "project" ? "Post Project" : "Post"}
        </PrimaryButton>
      </div>
    </div>
  );
}
