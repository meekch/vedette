import { PageHeader } from "@/components/nav/page-header";
import { ComingSoon } from "@/components/nav/coming-soon";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload and browse the organization's source material"
      />
      <ComingSoon phase={2} title="Knowledge Engine">
        <p>
          Phase 2 adds document upload to Supabase storage, parsing
          (pdf/docx/txt/csv), chunking, pgvector embeddings, and entity
          extraction — every extracted claim linked back to its source text.
        </p>
      </ComingSoon>
    </>
  );
}
