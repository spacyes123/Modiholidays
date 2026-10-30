"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { employee, database } from "./supabase";
import {
  enquirySchema,
  itinerarySchema,
  quoteSchema,
  supplierSchema,
  money,
} from "./schemas";
const uuid = z.uuid();
const optionalId = uuid.nullable();
export async function login(form: FormData) {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1).max(512) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/admin/login?error=credentials");
  const db = await database();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) redirect("/admin/login?error=credentials");
  const access = await employee();
  if (!access.profile.active) {
    await db.auth.signOut();
    redirect("/admin/login?error=access");
  }
  redirect("/admin");
}
export async function logout() {
  const db = await database();
  await db.auth.signOut();
  redirect("/admin/login");
}
export async function mutate(
  operation: string,
  input: unknown,
): Promise<{ id?: string; error?: string; message?: string }> {
  try {
    const { db, profile } = await employee();
    let result: { data: unknown; error: { message: string } | null };
    const obj = z.record(z.string(), z.unknown()).parse(input);
    switch (operation) {
      case "enquiry": {
        const data = enquirySchema.parse(obj.data);
        result = await db.rpc("save_enquiry", {
          p_id: optionalId.parse(obj.id),
          p_data: data,
        });
        break;
      }
      case "itinerary": {
        const data = itinerarySchema.parse(obj.data);
        result = await db.rpc("save_itinerary", {
          p_id: optionalId.parse(obj.id),
          p_data: data,
        });
        break;
      }
      case "quotation": {
        result = await db.rpc("create_quotation", {
          p_itinerary: uuid.parse(obj.itinerary_id),
          p_title: z.string().min(1).max(240).parse(obj.title),
        });
        break;
      }
      case "version": {
        result = await db.rpc("save_quote_version", {
          p_quotation: uuid.parse(obj.quotation_id),
          p_id: optionalId.parse(obj.id),
          p_revision: z.number().int().nonnegative().parse(obj.revision),
          p_data: quoteSchema.parse(obj.data),
        });
        break;
      }
      case "approve": {
        if (profile.role !== "admin")
          throw Error("Only an admin can approve quotations.");
        result = await db.rpc("approve_quote", {
          p_id: uuid.parse(obj.id),
          p_revision: z.number().int().parse(obj.revision),
        });
        break;
      }
      case "mark": {
        result = await db.rpc("mark_quote", {
          p_id: uuid.parse(obj.id),
          p_status: z.enum(["Ready to send", "Sent"]).parse(obj.status),
        });
        break;
      }
      case "booking": {
        result = await db.rpc("convert_booking", {
          p_version: uuid.parse(obj.version_id),
          p_due: z.iso.date().parse(obj.payment_due),
        });
        break;
      }
      case "payment": {
        const amount = money.refine((v) => Number(v) > 0).parse(obj.amount);
        result = await db.rpc("record_payment", {
          p_booking: uuid.parse(obj.booking_id),
          p_amount: amount,
          p_date: z.iso.date().parse(obj.paid_on),
          p_method: z.string().min(1).max(80).parse(obj.method),
          p_reference: z.string().min(1).max(240).parse(obj.reference),
        });
        break;
      }
      case "booking-state": {
        result = await db.rpc("set_booking_state", {
          p_id: uuid.parse(obj.id),
          p_status: z
            .enum([
              "Pending",
              "Advance Received",
              "Supplier Confirmation",
              "Confirmed",
              "Completed",
              "Cancelled",
            ])
            .parse(obj.status),
          p_confirmation: z
            .enum(["Pending", "Partial", "Confirmed"])
            .parse(obj.confirmation),
        });
        break;
      }
      case "supplier": {
        const data = supplierSchema.parse(obj.data);
        const row = {
          name: data.name,
          category: data.category,
          destination: data.destination,
          details: data,
        };
        const id = optionalId.parse(obj.id);
        result = id
          ? await db
              .from("suppliers")
              .update(row)
              .eq("id", id)
              .select("id")
              .single()
          : await db.from("suppliers").insert(row).select("id").single();
        break;
      }
      case "rate": {
        const row = z
          .object({
            supplier_id: uuid,
            description: z.string().min(1).max(240),
            amount: money,
            currency: z.string().regex(/^[A-Z]{3}$/),
            valid_until: z.iso.date(),
            source: z.string().min(1).max(240),
            last_verified: z.iso.date(),
          })
          .parse(obj.data);
        const query = obj.id
          ? db.from("supplier_rates").update(row).eq("id", uuid.parse(obj.id))
          : db.from("supplier_rates").insert(row);
        result = await query.select("id").single();
        break;
      }
      case "activity": {
        result = await db
          .from("enquiry_activities")
          .insert({
            enquiry_id: uuid.parse(obj.enquiry_id),
            kind: z
              .enum(["Call", "WhatsApp", "Email", "Follow-up", "Note"])
              .parse(obj.kind),
            body: z.string().trim().min(1).max(6000).parse(obj.body),
          })
          .select("id")
          .single();
        break;
      }
      case "template": {
        const data = itinerarySchema.parse(obj.data);
        result = await db
          .from("itinerary_templates")
          .insert({ title: data.title, details: data })
          .select("id")
          .single();
        break;
      }
      case "settings": {
        if (profile.role !== "admin") throw Error("Admin required.");
        result = await db.rpc("set_operations_settings", {
          p_margin: z.coerce.number().min(0).max(99.99).parse(obj.margin),
          p_email: z.email().or(z.literal("")).parse(obj.email),
        });
        break;
      }
      default:
        throw Error("Unsupported operation.");
    }
    if (result.error) throw Error(result.error.message);
    revalidatePath("/admin", "layout");
    const data = result.data;
    return {
      id:
        typeof data === "string"
          ? data
          : typeof data === "object" && data && "id" in data
            ? String(data.id)
            : undefined,
      message: "Saved to database.",
    };
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return {
      error:
        error instanceof z.ZodError
          ? error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ")
          : error instanceof Error
            ? error.message
            : "Save failed. Nothing has been confirmed.",
    };
  }
}
