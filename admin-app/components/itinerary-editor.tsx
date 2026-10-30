"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "@/lib/actions";
import { Fields, type FieldSpec } from "./forms";
import type { ItineraryInput } from "@/lib/schemas";
type Template = {
  id: string;
  title: string;
  destination?: string;
  days: ItineraryInput["days"];
};
const blankDay = () => ({
  city: "",
  title: "New day",
  date: "",
  description: "",
  hotel: "",
  meals: "",
  sightseeing: "",
  transport: "",
  pickup_drop: "",
  optional_activities: "",
  image: "",
  internal_notes: "",
});
const dayFields: FieldSpec[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "city", label: "City" },
  { key: "title", label: "Day title", required: true },
  { key: "hotel", label: "Hotel (proposed unless confirmed)" },
  {
    key: "description",
    label: "Detailed day description",
    type: "textarea",
    required: true,
  },
  { key: "sightseeing", label: "Sightseeing activities", type: "textarea" },
  { key: "meals", label: "Meals" },
  { key: "transport", label: "Transport" },
  { key: "pickup_drop", label: "Pickup / drop details", type: "textarea" },
  {
    key: "optional_activities",
    label: "Optional activities",
    type: "textarea",
  },
  { key: "image", label: "Destination image path (assets/photos/...)" },
  {
    key: "internal_notes",
    label: "Internal notes — excluded from customer views",
    type: "textarea",
  },
];
export default function ItineraryEditor({
  id,
  initial,
  enquiries,
  templates,
}: {
  id?: string;
  initial: ItineraryInput;
  enquiries: { id: string; title: string }[];
  templates: Template[];
}) {
  const [data, setData] = useState(initial),
    [status, setStatus] = useState(
      id ? "Saved revision " + initial.revision : "Unsaved draft",
    ),
    [saving, setSaving] = useState(false);
  const drag = useRef<number | null>(null),
    last = useRef(JSON.stringify({ ...initial, revision: 0 })),
    busy = useRef(false);
  const router = useRouter();
  const fingerprint = JSON.stringify({ ...data, revision: 0 });
  const save = useCallback(
    async (automatic = false) => {
      if (busy.current) return;
      busy.current = true;
      setSaving(true);
      setStatus("Saving to database…");
      const snapshot = fingerprint;
      const result = await mutate("itinerary", { id: id || null, data });
      busy.current = false;
      setSaving(false);
      if (result.error) {
        setStatus("Not saved: " + result.error);
        return;
      }
      last.current = snapshot;
      setStatus("Saved " + new Date().toLocaleTimeString());
      if (!id && result.id) {
        router.push("/admin/itineraries/" + result.id);
        router.refresh();
      } else {
        setData((old) => ({ ...old, revision: old.revision + 1 }));
        if (!automatic) router.refresh();
      }
    },
    [data, fingerprint, id, router],
  );
  useEffect(() => {
    if (!id || fingerprint === last.current) return;
    setStatus("Unsaved changes — autosave pending…");
    const timer = setTimeout(() => {
      void save(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [fingerprint, id, save]); // Save failures are visible and never treated as success.
  const fields: FieldSpec[] = [
    { key: "title", label: "Tour title", required: true },
    {
      key: "enquiry_id",
      label: "Customer enquiry",
      options: [
        { value: "", label: "Select an enquiry" },
        ...enquiries.map((e) => ({ value: e.id, label: e.title })),
      ],
      required: true,
    },
    { key: "destinations", label: "Destinations", required: true },
    { key: "departure_city", label: "Departure city" },
    { key: "start_date", label: "Travel start", type: "date" },
    { key: "end_date", label: "Travel end", type: "date" },
    { key: "adults", label: "Adults", type: "number" },
    { key: "children", label: "Children", type: "number" },
    { key: "infants", label: "Infants", type: "number" },
    { key: "hotel_category", label: "Hotel category" },
    { key: "tour_type", label: "Tour type" },
    { key: "internal_notes", label: "Internal notes", type: "textarea" },
  ];
  return (
    <div>
      <div className="panel">
        <label>
          Reuse a catalogue / saved template
          <select
            defaultValue=""
            onChange={(e) => {
              const t = templates.find((t) => t.id === e.target.value);
              if (
                t &&
                window.confirm("Replace the current days with this template?")
              )
                setData({
                  ...data,
                  title: t.title,
                  destinations: t.destination || data.destinations,
                  days: structuredClone(t.days),
                });
            }}
          >
            <option value="">Choose a template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <p className="small">
          Catalogue itineraries are planning drafts, not supplier-confirmed
          arrangements.
        </p>
        <Fields
          spec={fields}
          data={data}
          onChange={(key, value) =>
            setData({
              ...data,
              [key]: ["adults", "children", "infants"].includes(key)
                ? Number(value)
                : value,
            })
          }
        />
        <p>
          {data.days.length} days / {Math.max(0, data.days.length - 1)} nights
        </p>
      </div>
      <div className="editor-toolbar">
        <h2>Your day-by-day journey</h2>
        <button
          className="secondary"
          onClick={() => setData({ ...data, days: [...data.days, blankDay()] })}
        >
          + Add day
        </button>
      </div>
      {data.days.map((day, index) => (
        <section
          className="panel day-editor"
          key={index}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (drag.current === null) return;
            const days = [...data.days];
            const [moved] = days.splice(drag.current, 1);
            days.splice(index, 0, moved);
            drag.current = null;
            setData({ ...data, days });
          }}
        >
          <div className="editor-toolbar">
            <h3>
              <span
                draggable
                onDragStart={() => (drag.current = index)}
                className="drag-handle"
                aria-label="Drag day to reorder"
              >
                ⠿
              </span>{" "}
              Day {index + 1}
            </h3>
            <div className="inline-actions">
              <button
                className="quiet"
                disabled={index === 0}
                onClick={() => {
                  const days = [...data.days];
                  [days[index - 1], days[index]] = [
                    days[index],
                    days[index - 1],
                  ];
                  setData({ ...data, days });
                }}
              >
                ↑ Earlier
              </button>
              <button
                className="quiet"
                disabled={index === data.days.length - 1}
                onClick={() => {
                  const days = [...data.days];
                  [days[index], days[index + 1]] = [
                    days[index + 1],
                    days[index],
                  ];
                  setData({ ...data, days });
                }}
              >
                ↓ Later
              </button>
              <button
                className="quiet"
                onClick={() => {
                  const days = [...data.days];
                  days.splice(index + 1, 0, structuredClone(day));
                  setData({ ...data, days });
                }}
              >
                Duplicate
              </button>
              <button
                className="danger"
                disabled={data.days.length === 1}
                onClick={() => {
                  if (window.confirm("Remove this day?"))
                    setData({
                      ...data,
                      days: data.days.filter((_, n) => n !== index),
                    });
                }}
              >
                Remove
              </button>
            </div>
          </div>
          <Fields
            spec={dayFields}
            data={day}
            onChange={(key, value) =>
              setData({
                ...data,
                days: data.days.map((d, n) =>
                  n === index ? { ...d, [key]: value } : d,
                ),
              })
            }
          />
        </section>
      ))}
      <div className="sticky-save">
        <button disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save draft"}
        </button>
        {id && (
          <>
            <a
              className="button secondary"
              href={"/admin/itineraries/" + id + "/preview"}
            >
              Customer preview
            </a>
            <button
              className="quiet"
              onClick={async () => {
                const r = await mutate("itinerary", {
                  id: null,
                  data: { ...data, revision: 0, title: data.title + " (copy)" },
                });
                setStatus(r.error || "Duplicated");
                if (r.id) router.push("/admin/itineraries/" + r.id);
              }}
            >
              Duplicate itinerary
            </button>
            <button
              className="quiet"
              onClick={async () => {
                const r = await mutate("template", { data });
                setStatus(r.error || "Template saved");
              }}
            >
              Save as template
            </button>
          </>
        )}
        <span role="status" aria-live="polite">
          {status}
        </span>
      </div>
    </div>
  );
}
