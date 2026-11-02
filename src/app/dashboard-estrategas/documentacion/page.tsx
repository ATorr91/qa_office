import type { Metadata } from "next";
import DocumentationCards from "@/components/dashboard/DocumentationCards";

export const metadata: Metadata = { title: "Documentación" };

// Rendered per request so the links follow the current environment (sheet id, Jira site) without a rebuild.
export const dynamic = "force-dynamic";

export default function DocumentacionPage() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const jiraBase = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
  return (
    <DocumentationCards
      sheetUrl={sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null}
      sheetTab={process.env.GOOGLE_BITACORAS_SHEET_TAB || "Bitácora"}
      jiraUrl={jiraBase ? `${jiraBase}/jira/projects` : null}
      figmaUrl={`https://www.figma.com/design/${process.env.FIGMA_FILE_KEY || "mRho5FbediwfbXutd2elxQ"}/Encuesta-de-Satisfacci%C3%B3n-de-clientes?node-id=0-1`}
      qaMailUrl="https://mail.google.com/mail/#search/subject%3A%22%5BEstatus+QA%22"
    />
  );
}
