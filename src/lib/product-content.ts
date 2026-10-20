export type ProductFaq = {
  question: string;
  answer: string;
};

export function parseProductFaqEntries(input: string): ProductFaq[] | null {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > 10) return null;

  const entries: ProductFaq[] = [];
  for (const line of lines) {
    const separatorIndex = line.indexOf("::");
    if (separatorIndex < 1) return null;

    const question = line.slice(0, separatorIndex).trim();
    const answer = line.slice(separatorIndex + 2).trim();
    if (!question || !answer || question.length > 500 || answer.length > 2000) return null;

    entries.push({ question, answer });
  }

  return entries;
}

export function formatProductFaqEntries(faqs: ProductFaq[] | null | undefined): string {
  return (faqs ?? []).map(({ question, answer }) => `${question} :: ${answer}`).join("\n");
}

export function parseProductApplications(input: string | null | undefined): string[] {
  return (input ?? "").split(/\r?\n/).map((application) => application.trim()).filter(Boolean);
}
