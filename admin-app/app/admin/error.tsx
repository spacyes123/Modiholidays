"use client";
import Link from "next/link";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="panel">
      <h1>We could not load this workspace</h1>
      <p>
        No changes were confirmed. Check the database configuration and employee
        access, then retry.
      </p>
      <button onClick={reset}>Try again</button>
      <Link href="/admin/login">Back to sign-in</Link>
    </main>
  );
}
