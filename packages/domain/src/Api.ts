import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";
import { Activity, ActivityFilter, ActivityId, ActivityInput } from "./Activity.ts";
import { Company, CompanyId, CompanyInput, CompanyPatch, CompanySummary } from "./Company.ts";
import { Contact, ContactId, ContactInput, ContactPatch, EmailTaken } from "./Contact.ts";
import { DashboardSummary } from "./Dashboard.ts";
import { Deal, DealId, DealInput, DealPatch } from "./Deal.ts";
import { NotFound } from "./shared.ts";

// The API contract lives in its own package so the server implements it and
// the web app derives a typed client from it, without either leaking into the
// other.

export class CompaniesGroup extends HttpApiGroup.make("companies")
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(CompanySummary) }),
    HttpApiEndpoint.get("get", "/:id", {
      params: { id: CompanyId },
      success: Company,
      error: NotFound,
    }),
    HttpApiEndpoint.post("create", "/", { payload: CompanyInput, success: Company }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: CompanyId },
      payload: CompanyPatch,
      success: Company,
      error: NotFound,
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: { id: CompanyId },
      success: HttpApiSchema.NoContent,
      error: NotFound,
    }),
  )
  .prefix("/api/companies") {}

export class ContactsGroup extends HttpApiGroup.make("contacts")
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(Contact) }),
    HttpApiEndpoint.get("get", "/:id", {
      params: { id: ContactId },
      success: Contact,
      error: NotFound,
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: ContactInput,
      success: Contact,
      error: EmailTaken,
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: ContactId },
      payload: ContactPatch,
      success: Contact,
      error: [NotFound, EmailTaken],
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: { id: ContactId },
      success: HttpApiSchema.NoContent,
      error: NotFound,
    }),
  )
  .prefix("/api/contacts") {}

export class DealsGroup extends HttpApiGroup.make("deals")
  .add(
    HttpApiEndpoint.get("list", "/", { success: Schema.Array(Deal) }),
    HttpApiEndpoint.get("get", "/:id", {
      params: { id: DealId },
      success: Deal,
      error: NotFound,
    }),
    HttpApiEndpoint.post("create", "/", { payload: DealInput, success: Deal }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: DealId },
      payload: DealPatch,
      success: Deal,
      error: NotFound,
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: { id: DealId },
      success: HttpApiSchema.NoContent,
      error: NotFound,
    }),
  )
  .prefix("/api/deals") {}

export class ActivitiesGroup extends HttpApiGroup.make("activities")
  .add(
    HttpApiEndpoint.get("list", "/", {
      query: ActivityFilter,
      success: Schema.Array(Activity),
    }),
    HttpApiEndpoint.post("create", "/", { payload: ActivityInput, success: Activity }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: { id: ActivityId },
      success: HttpApiSchema.NoContent,
      error: NotFound,
    }),
  )
  .prefix("/api/activities") {}

export class DashboardGroup extends HttpApiGroup.make("dashboard")
  .add(HttpApiEndpoint.get("summary", "/", { success: DashboardSummary }))
  .prefix("/api/dashboard") {}

export class CrmApi extends HttpApi.make("crm-api")
  .add(CompaniesGroup)
  .add(ContactsGroup)
  .add(DealsGroup)
  .add(ActivitiesGroup)
  .add(DashboardGroup) {}
