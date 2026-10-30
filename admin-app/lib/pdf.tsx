/* eslint-disable jsx-a11y/alt-text -- React PDF Image is a PDF primitive, not an HTML image. */
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { type CustomerQuote } from "./customer-quote";
import { inr } from "./pricing";
const fonts = path.join(process.cwd(), "fonts");
Font.register({
  family: "Noto Sans",
  fonts: [
    { src: path.join(fonts, "NotoSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fonts, "NotoSans-Bold.ttf"), fontWeight: 700 },
  ],
});
const styles = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans",
    fontSize: 10,
    lineHeight: 1.5,
    paddingTop: 46,
    paddingBottom: 50,
    paddingHorizontal: 44,
    color: "#29232B",
  },
  cover: { backgroundColor: "#FFF8F0" },
  logo: { width: 120, height: 120, objectFit: "contain" },
  brand: { color: "#55234B", fontSize: 11, marginBottom: 18 },
  h1: {
    fontSize: 24,
    lineHeight: 1.3,
    color: "#55234B",
    fontWeight: 700,
    marginBottom: 16,
  },
  h2: {
    fontSize: 17,
    color: "#55234B",
    fontWeight: 700,
    marginBottom: 10,
    marginTop: 20,
  },
  h3: { fontSize: 12, fontWeight: 700, color: "#55234B", marginBottom: 7 },
  photo: { width: "100%", height: 200, objectFit: "cover", marginBottom: 18 },
  band: {
    padding: 14,
    backgroundColor: "#F39A24",
    marginTop: 18,
    marginBottom: 18,
  },
  detail: { marginBottom: 7 },
  day: {
    marginBottom: 20,
    borderBottom: "1px solid #E8DCE3",
    paddingBottom: 12,
  },
  footer: {
    position: "absolute",
    top: 807,
    height: 14,
    lineHeight: 1.2,
    left: 44,
    right: 44,
    fontSize: 8,
    color: "#6C5968",
  },
  small: { fontSize: 8, color: "#6C5968" },
  box: { padding: 14, backgroundColor: "#FFF8F0", marginBottom: 14 },
});
async function safeImage(image: string) {
  if (!/^assets\/photos\/[a-z0-9-]+\.webp$/.test(image)) return undefined;
  const file = path.join(process.cwd(), "public", image);
  if (!fs.existsSync(file)) return undefined;
  return (
    "data:image/png;base64," +
    (
      await sharp(file)
        .resize({ width: 1000, withoutEnlargement: true })
        .png()
        .toBuffer()
    ).toString("base64")
  );
}
export async function renderCustomerPdf(q: CustomerQuote) {
  const hero = await safeImage(q.days.find((d) => d.image)?.image || "");
  const logo =
    "data:image/png;base64," +
    fs
      .readFileSync(
        path.join(process.cwd(), "public/assets/brand/logo-256.png"),
      )
      .toString("base64");
  const footer = (
    <View fixed style={styles.footer}>
      <Text style={{ fontSize: 8, lineHeight: 1.2 }}>
        Modi Holidays · +91 7666018401 · {q.reference}
      </Text>
    </View>
  );
  const section = (title: string, body: string) => (
    <View>
      <Text style={styles.h2}>{title}</Text>
      <Text>
        {body || "To be specified and agreed in writing before booking."}
      </Text>
    </View>
  );
  return renderToBuffer(
    <Document title={q.title} author="Modi Holidays">
      <Page size="A4" style={[styles.page, styles.cover]}>
        <Image style={styles.logo} src={logo} />
        <Text style={styles.brand}>
          MODI HOLIDAYS · YOUR PERSONALISED JOURNEY
        </Text>
        <Text style={styles.h1}>{q.title}</Text>
        {hero && <Image style={styles.photo} src={hero} />}
        <Text style={styles.h3}>Prepared for {q.customer.name}</Text>
        <Text>{q.tour.destinations}</Text>
        <Text>
          {q.tour.start_date || "Dates to be agreed"} —{" "}
          {q.tour.end_date || "Dates to be agreed"}
        </Text>
        <Text>
          {q.days.length} days / {Math.max(0, q.days.length - 1)} nights ·{" "}
          {q.tour.adults} adults · {q.tour.children} children · {q.tour.infants}{" "}
          infants
        </Text>
        <Text>Departure: {q.tour.departure_city || "To be agreed"}</Text>
        <View style={styles.band}>
          <Text style={styles.h3}>Total package price: {inr(q.price)}</Text>
          <Text>Valid until {q.valid_until}</Text>
        </View>
        <Text style={styles.small}>
          Pricing and availability remain subject to confirmation unless the
          relevant services have actually been confirmed in writing. This
          document is a quotation, not a booking confirmation.
        </Text>
        {footer}
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Your travel details</Text>
        <View style={styles.box}>
          <Text>Customer: {q.customer.name}</Text>
          <Text>
            Contact: {q.customer.mobile}
            {q.customer.email ? " · " + q.customer.email : ""}
          </Text>
          <Text>Hotel category: {q.tour.hotel_category || "To be agreed"}</Text>
          <Text>Reference: {q.reference}</Text>
        </View>
        <Text style={styles.h2}>Day-by-day itinerary</Text>
        {q.days.map((d) => (
          <View key={d.position} style={styles.day}>
            <View wrap={false}>
              <Text style={styles.h3}>
                Day {d.position} · {d.title}
                {d.city ? " · " + d.city : ""}
              </Text>
              {d.date && <Text style={styles.small}>{d.date}</Text>}
              <Text>{d.description.split(" ").slice(0, 40).join(" ")}</Text>
            </View>
            {d.description.split(" ").length > 40 && (
              <Text orphans={3} widows={3}>
                {d.description.split(" ").slice(40).join(" ")}
              </Text>
            )}
            {[
              ["Sightseeing", d.sightseeing],
              ["Hotel", d.hotel],
              ["Meals", d.meals],
              ["Transport", d.transport],
              ["Pickup / drop", d.pickup_drop],
              ["Optional activities", d.optional_activities],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <Text key={k} style={styles.detail}>
                  {k}: {v}
                </Text>
              ))}
          </View>
        ))}
        {footer}
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Your quotation</Text>
        {section("Hotel details", q.hotel_details)}
        {section("Transport details", q.transport_details)}
        {section("Package inclusions", q.inclusions)}
        {section("Package exclusions", q.exclusions)}
        <View style={styles.band}>
          <Text style={styles.h3}>Total: {inr(q.price)}</Text>
          <Text>
            Included applicable tax: {inr(q.tax)} · TCS: {inr(q.tcs)}
          </Text>
          {q.adult_price && <Text>Adult allocation: {inr(q.adult_price)}</Text>}
          {q.child_price && <Text>Child allocation: {inr(q.child_price)}</Text>}
          {q.infant_price && (
            <Text>Infant allocation: {inr(q.infant_price)}</Text>
          )}
        </View>
        {section("Payment schedule", q.payment_schedule)}
        {section("Cancellation policy", q.cancellation_policy)}
        {section("Important travel notes", q.travel_notes)}
        <Text style={styles.h2}>We are here to help</Text>
        <Text>Modi Holidays · +91 7666018401 · modiholidays.in</Text>
        <Text>Quotation validity: {q.valid_until}</Text>
        <Text style={styles.small}>
          Prices, service availability and supplier arrangements are subject to
          written confirmation. No departure or accommodation is guaranteed by
          this quotation alone.
        </Text>
        {footer}
      </Page>
    </Document>,
  );
}
