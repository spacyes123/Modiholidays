import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { customerQuote } from "./customer-quote";
import { renderCustomerPdf } from "./pdf";
export async function approvedPdf(db: SupabaseClient, id: string) {
  const { data, error } = await db
    .from("quotation_versions")
    .select("id,status,approved_at,snapshot")
    .eq("id", id)
    .single();
  if (error || !data?.approved_at || data.status === "Draft")
    throw Error("Only approved quotations may be exported.");
  const snapshot = customerQuote(data.snapshot);
  const { data: previous, error: lookupError } = await db
    .from("pdf_exports")
    .select("path,sha256")
    .eq("version_id", id)
    .order("created_at")
    .limit(1);
  if (lookupError) throw Error("Saved PDF history is unavailable.");
  if (previous?.[0]) {
    const { data: file, error: downloadError } = await db.storage
      .from("quotations")
      .download(previous[0].path);
    if (downloadError || !file)
      throw Error("The saved PDF is unavailable; contact the administrator.");
    const bytes = Buffer.from(await file.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== previous[0].sha256)
      throw Error("Saved PDF integrity check failed.");
    return { bytes, snapshot, filePath: previous[0].path };
  }
  const bytes = await renderCustomerPdf(snapshot);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const filePath = id + "/" + hash + ".pdf";
  const { error: uploadError } = await db.storage
    .from("quotations")
    .upload(filePath, bytes, { contentType: "application/pdf", upsert: false });
  if (uploadError && !/already exists|duplicate/i.test(uploadError.message))
    throw Error("PDF storage failed; no export was confirmed.");
  const { error: registerError } = await db.rpc("register_pdf", {
    p_version: id,
    p_path: filePath,
    p_hash: hash,
  });
  if (registerError) throw Error("PDF could not be linked to this quotation.");
  return { bytes, snapshot, filePath };
}
