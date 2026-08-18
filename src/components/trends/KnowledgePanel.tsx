"use client";

import { useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import { extractPdfText } from "@/lib/pdf";
import { KNOWLEDGE_KIND_LABELS, useKnowledge } from "@/lib/knowledgeStore";

type AddMode = "none" | "pdf" | "link" | "image" | "file";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function inputClass() {
  return "w-full rounded-[var(--bp-radius-sm)] border border-[var(--bp-border)] bg-[var(--bp-surface)] px-2.5 py-1.5 text-[12px] text-[var(--bp-ink)] outline-none focus:border-[var(--bp-blue)]";
}

export function KnowledgePanel() {
  const { docs, addDoc, removeDoc } = useKnowledge();
  const [addMode, setAddMode] = useState<AddMode>("none");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDesc, setLinkDesc] = useState("");

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileDesc, setFileDesc] = useState("");

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePdfFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.type !== "application/pdf") {
          setError(`"${file.name}" no es un PDF.`);
          continue;
        }
        const { text, pages } = await extractPdfText(file);
        addDoc({ kind: "pdf", name: file.name.replace(/\.pdf$/i, ""), addedAt: new Date().toISOString(), pages, text });
      }
    } catch {
      setError("No se pudo leer el PDF. Intenta con otro archivo.");
    } finally {
      setUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  function handleAddLink() {
    if (linkName.trim() === "" || linkUrl.trim() === "") return;
    addDoc({ kind: "link", name: linkName.trim(), url: linkUrl.trim(), text: linkDesc.trim(), addedAt: new Date().toISOString() });
    setLinkName("");
    setLinkUrl("");
    setLinkDesc("");
    setAddMode("none");
  }

  function handlePickImageOrFile(kind: "image" | "file", files: FileList | null) {
    if (!files || files.length === 0) return;
    setPendingFile(files[0]);
    setFileDesc("");
    setAddMode(kind);
  }

  function handleConfirmFile(kind: "image" | "file") {
    if (!pendingFile) return;
    addDoc({
      kind,
      name: pendingFile.name,
      text: fileDesc.trim(),
      addedAt: new Date().toISOString(),
    });
    setPendingFile(null);
    setFileDesc("");
    setAddMode("none");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cancelAdd() {
    setAddMode("none");
    setLinkName("");
    setLinkUrl("");
    setLinkDesc("");
    setPendingFile(null);
    setFileDesc("");
  }

  const deletingDoc = deletingId ? docs.find((d) => d.id === deletingId) : undefined;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--bp-radius-lg)] border border-[var(--bp-border)] bg-[var(--bp-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[13px] font-semibold text-[var(--bp-ink)]">Base de conocimiento</h2>
          <Tooltip text="Sube PDFs, links, imágenes u otros documentos: se indexan localmente y se usan como contexto adicional al buscar tendencias." />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button kind="outline" size="sm" onClick={() => pdfInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Procesando…" : "+ PDF"}
          </Button>
          <Button kind={addMode === "link" ? "primary" : "outline"} size="sm" onClick={() => setAddMode(addMode === "link" ? "none" : "link")}>
            + Link
          </Button>
          <Button kind="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
            + Imagen
          </Button>
          <Button kind="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            + Otro archivo
          </Button>
        </div>
        <input ref={pdfInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => handlePdfFiles(e.target.files)} />
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handlePickImageOrFile("image", e.target.files)} />
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handlePickImageOrFile("file", e.target.files)} />
      </div>

      {error && <p className="text-[12px] text-[var(--bp-danger)]">{error}</p>}

      {addMode === "link" && (
        <div className="flex flex-col gap-2 rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] p-3 sm:flex-row sm:items-end sm:gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Nombre</label>
            <input type="text" value={linkName} onChange={(e) => setLinkName(e.target.value)} className={inputClass()} placeholder="p. ej. Reporte de innovación 2026" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">URL</label>
            <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={inputClass()} placeholder="https://…" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">Descripción (opcional)</label>
            <input type="text" value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} className={inputClass()} placeholder="¿De qué trata?" />
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" onClick={handleAddLink} disabled={linkName.trim() === "" || linkUrl.trim() === ""}>
              Agregar
            </Button>
            <Button kind="outline" size="sm" onClick={cancelAdd}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {(addMode === "image" || addMode === "file") && pendingFile && (
        <div className="flex flex-col gap-2 rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] p-3 sm:flex-row sm:items-end sm:gap-2">
          <div className="text-[12px] text-[var(--bp-ink)]">
            <span className="font-semibold">{pendingFile.name}</span>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--bp-ink-soft)]">
              Descripción (opcional, ayuda a que la búsqueda lo encuentre)
            </label>
            <input type="text" value={fileDesc} onChange={(e) => setFileDesc(e.target.value)} className={inputClass()} placeholder="¿Qué contiene este archivo?" />
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" onClick={() => handleConfirmFile(addMode)}>
              Agregar
            </Button>
            <Button kind="outline" size="sm" onClick={cancelAdd}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="rounded-[var(--bp-radius-md)] border border-dashed border-[var(--bp-border)] px-4 py-6 text-center text-[12px] text-[var(--bp-ink-soft)]">
          Aún no has subido documentos. Sube PDFs, links, imágenes u otros archivos para enriquecer la búsqueda con tu propio conocimiento.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              className="bp-row-in flex items-start justify-between gap-2 rounded-[var(--bp-radius-md)] border border-[var(--bp-border)] p-3 transition-shadow duration-[var(--bp-dur)] hover:shadow-[var(--bp-shadow-sm)]"
              style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge dot={false} color="neutral" className="text-[9px] uppercase tracking-[0.03em]">
                    {KNOWLEDGE_KIND_LABELS[doc.kind]}
                  </Badge>
                </div>
                {doc.kind === "link" && doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-[12px] font-semibold text-[var(--bp-blue)] hover:underline">
                    {doc.name}
                  </a>
                ) : (
                  <div className="mt-1 truncate text-[12px] font-semibold text-[var(--bp-ink)]">{doc.name}</div>
                )}
                <div className="mt-0.5 font-mono text-[10px] text-[var(--bp-ink-soft)]">
                  {doc.kind === "pdf" && doc.pages ? `${doc.pages} pág. · ` : ""}
                  {formatDate(doc.addedAt)}
                </div>
              </div>
              <button
                type="button"
                aria-label="Eliminar documento"
                onClick={() => setDeletingId(doc.id)}
                className="bp-tap shrink-0 rounded-[var(--bp-radius-sm)] p-1 text-[var(--bp-ink-soft)] transition-transform duration-[var(--bp-dur-fast)] hover:scale-110 hover:bg-[var(--bp-surface-alt)] hover:text-[var(--bp-danger)]"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingDoc}
        title="Eliminar documento"
        description={`¿Eliminar "${deletingDoc?.name}" de tu base de conocimiento?`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (deletingId) removeDoc(deletingId);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

export default KnowledgePanel;
