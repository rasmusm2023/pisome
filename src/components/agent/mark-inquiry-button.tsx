"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function MarkInquiryButton({
  id,
  status,
}: {
  id: string;
  status: "READ" | "REPLIED" | "CLOSED";
}) {
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        await fetch("/api/inquiries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
        router.refresh();
      }}
    >
      Mark {status.toLowerCase()}
    </Button>
  );
}
