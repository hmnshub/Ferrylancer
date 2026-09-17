let nextTaskId = 1;

function emit(type, task) {
  window.dispatchEvent(new CustomEvent("ferrylance:background-task", { detail: { type, task } }));
}

export function runBackgroundTask({ label, kind = "upload", run }) {
  const id = nextTaskId++;
  emit("add", { id, label, kind, progress: 8, status: "working" });
  let simulatedProgress = 8;
  const update = (progress, nextLabel = label) => { simulatedProgress = progress; emit("update", { id, progress, label: nextLabel }); };
  const ticker = kind === "upload" ? window.setInterval(() => {
    simulatedProgress = Math.min(92, simulatedProgress + 4);
    emit("update", { id, progress: simulatedProgress });
  }, 700) : null;
  const promise = Promise.resolve().then(() => run(update));
  promise.then(() => {
    if (ticker) window.clearInterval(ticker);
    emit("update", { id, progress: 100, status: "done", label: kind === "delete" ? "Deleted" : "Complete" });
    window.setTimeout(() => emit("remove", { id }), 1800);
  }).catch((error) => {
    if (ticker) window.clearInterval(ticker);
    emit("update", { id, status: "error", label: error?.message || "Action failed" });
    window.setTimeout(() => emit("remove", { id }), 5000);
  });
  return promise;
}
