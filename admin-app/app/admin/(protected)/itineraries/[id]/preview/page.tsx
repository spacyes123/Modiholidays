import { record, records } from "@/lib/data";
export default async function ItineraryPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itinerary = await record("itineraries", id);
  const days = (await records("itinerary_days"))
    .filter((d) => d.itinerary_id === id)
    .sort((a, b) => Number(a.position) - Number(b.position));
  return (
    <article className="customer-preview">
      <img
        src="/assets/brand/logo-256.png"
        alt="Modi Holidays"
        width="130"
        height="130"
      />
      <p className="eyebrow">Customer itinerary preview · planning draft</p>
      <h1>{itinerary.title}</h1>
      <p>
        {String(itinerary.details.destinations)} · {days.length} days /{" "}
        {Math.max(0, days.length - 1)} nights
      </p>
      {days.map((day) => (
        <section className="panel" key={day.id}>
          <h2>
            Day {String(day.position)} · {String(day.details.title)}
          </h2>
          <p>{String(day.details.description)}</p>
          {[
            "city",
            "hotel",
            "meals",
            "sightseeing",
            "transport",
            "pickup_drop",
            "optional_activities",
          ].map((key) =>
            day.details[key] ? (
              <p key={key}>
                <strong>{key.replaceAll("_", " ")}:</strong>{" "}
                {String(day.details[key])}
              </p>
            ) : null,
          )}
        </section>
      ))}
      <p>Proposed arrangements remain subject to written confirmation.</p>
    </article>
  );
}
