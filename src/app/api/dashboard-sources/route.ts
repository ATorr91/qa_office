import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || "mRho5FbediwfbXutd2elxQ";

/** Where each metric's numbers come from, so every tab can link to its source. Links follow the current environment. */
export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const jiraBase = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
  return NextResponse.json(
    {
      bitacorasSheetUrl: sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` : null,
      jiraUrl: jiraBase ? `${jiraBase}/jira/projects` : null,
      figmaUrl: `https://www.figma.com/design/${FIGMA_FILE_KEY}/Encuesta-de-Satisfacci%C3%B3n-de-clientes?node-id=0-1`,
      qaMailUrl: "https://mail.google.com/mail/#search/subject%3A%22%5BEstatus+QA%22",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
