"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import type { LibraryBook } from "@/lib/books/types";
import { cn } from "@/lib/utils";

type CoverBook = Pick<LibraryBook, "title" | "authors" | "coverUrl">;

export function LibraryBookCover({ book, className }: { book: CoverBook; className?: string }) {
  return <CoverContent key={book.coverUrl ?? "fallback"} book={book} className={className} />;
}

function CoverContent({ book, className }: { book: CoverBook; className?: string }) {
  const author = book.authors.join(", ");
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("personal-cover", className)}>
      <div className="personal-cover-fallback"><BookOpen aria-hidden="true" /><strong>{book.title}</strong>{author && <small>{author}</small>}</div>
      {book.coverUrl && !failed && <Image src={book.coverUrl} alt={`${book.title}${author ? ` — ${author}` : ""}`} fill sizes="(max-width: 768px) 44vw, 220px" unoptimized onError={() => setFailed(true)} />}
    </div>
  );
}
