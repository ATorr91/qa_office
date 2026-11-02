import SelfEvalForm from "@/components/dashboard/selfeval/SelfEvalForm";

export const metadata = { title: "Tu autoevaluación · BluePixel", robots: { index: false, follow: false } };

export default async function AutoevaluacionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SelfEvalForm token={token} />;
}
