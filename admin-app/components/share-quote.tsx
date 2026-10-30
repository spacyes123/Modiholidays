"use client";
import { useState } from "react";
import { inr } from "@/lib/pricing";
export default function ShareQuote({
  versionId,
  snapshot,
  status,
}: {
  versionId: string;
  snapshot: Record<string, unknown>;
  status: string;
}) {
  const [notice, setNotice] = useState("");
  const customer = snapshot.customer as { name: string; mobile: string };
  const summary = `Modi Holidays · ${String(snapshot.reference)}\n${String(snapshot.title)}\nCustomer: ${customer.name}\nTotal: ${inr(String(snapshot.price))}\nValid until: ${String(snapshot.valid_until)}\nPricing and availability remain subject to confirmation unless expressly confirmed. Please review the quotation PDF.`;
  const phone = customer.mobile.replace(/\D/g, "");
  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setNotice("Customer summary copied.");
    } catch {
      setNotice("Clipboard unavailable. Select the summary below.");
    }
  }
  async function email() {
    if (
      !window.confirm(
        "Send this approved quotation PDF by the configured authenticated email service?",
      )
    )
      return;
    setNotice("Sending…");
    try {
      const r = await fetch("/api/admin/quotations/" + versionId + "/email", {
        method: "POST",
      });
      const body = await r.json();
      setNotice(body.message || body.error || "Unable to send.");
    } catch {
      setNotice("Delivery not confirmed; check the provider before retrying.");
    }
  }
  return (
    <>
      <p className="badge">{status}</p>
      <div className="inline-actions">
        <a
          className="button"
          href={"/api/admin/quotations/" + versionId + "/pdf"}
        >
          Generate / download saved PDF
        </a>
        <button className="secondary" onClick={copy}>
          Copy summary
        </button>
        {phone.length >= 10 && (
          <a
            className="button secondary"
            target="_blank"
            rel="noopener noreferrer"
            href={
              "https://wa.me/" + phone + "?text=" + encodeURIComponent(summary)
            }
          >
            Open WhatsApp
          </a>
        )}
        <button className="secondary" onClick={email}>
          Send email if configured
        </button>
      </div>
      <p className="small">
        WhatsApp opens a prefilled message only. Download and attach the PDF
        yourself; then record the actual sent date. The website does not claim
        WhatsApp delivery.
      </p>
      <pre className="customer-summary">{summary}</pre>
      <p role="status">{notice}</p>
    </>
  );
}
