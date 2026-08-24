"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export default function AdminPageSizeSelect({ value }: { value: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("pageSize", nextValue);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      aria-label="Page size"
      name="pageSize"
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      className="rounded border px-2 py-1 text-sm whitespace-normal w-auto flex-shrink-0"
    >
      {PAGE_SIZE_OPTIONS.map((pageSize) => (
        <option key={pageSize} value={pageSize}>
          {pageSize} per page
        </option>
      ))}
    </select>
  );
}
