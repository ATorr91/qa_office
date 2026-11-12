"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { PdfJob } from "@/components/proceso/ExportMenu";
import { markdownToHtml } from "@/lib/markdownToHtml";

interface Sheet {
  node: ReactNode;
  /** Becomes the file name the browser proposes for the PDF. */
  title?: string;
}

/**
 * "Save as PDF" through the browser's print dialog. The sheet is rendered for print only, after the page has had a frame to
 * show it, and the document title is set meanwhile because the browser proposes it as the file name.
 * Put `sheet` next to the page and wrap the page itself in `print:hidden`.
 */
export function usePrintSheet() {
  const [sheet, setSheet] = useState<Sheet | null>(null);

  useEffect(() => {
    const original = document.title;
    const clear = () => {
      setSheet(null);
      document.title = original;
    };
    window.addEventListener("afterprint", clear);
    return () => {
      window.removeEventListener("afterprint", clear);
      document.title = original;
    };
  }, []);

  useEffect(() => {
    if (!sheet) return;
    if (sheet.title) document.title = sheet.title;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    return () => cancelAnimationFrame(id);
  }, [sheet]);

  return {
    printNode: (node: ReactNode, title?: string) => setSheet({ node, title }),
    printMarkdown: (job: PdfJob) => setSheet({ node: <div className="bp-md" dangerouslySetInnerHTML={{ __html: markdownToHtml(job.markdown) }} />, title: job.title }),
    sheet: sheet ? <div className="hidden print:block">{sheet.node}</div> : null,
  };
}
