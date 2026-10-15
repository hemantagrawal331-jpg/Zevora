import { sourcingCategories, subcategoriesFor } from "@/lib/sourcing/categories";
import { ValidationError } from "@/lib/sourcing/errors";
import type {
  PermissionStatus,
  SourcingDepartment,
  SourcingDraft,
  SourcingInput,
  SourcingQuery,
  WorkflowStatus,
} from "@/lib/sourcing/types";

export const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_PRICE = 10_000_000;
const MAX_MOQ = 1_000_000;

const permissions: PermissionStatus[] = ["NOT_PROVIDED", "PENDING", "GRANTED", "DENIED"];

const workflow: WorkflowStatus[] = [
  "SHORTLISTED",
  "SUPPLIER_IDENTIFIED",
  "VERIFICATION_PENDING",
  "APPROVED_FOR_SOURCING",
  "STOCK_VERIFIED",
  "READY_TO_PUBLISH",
  "REJECTED",
  "ARCHIVED",
];

const transitions: Record<WorkflowStatus, WorkflowStatus[]> = {
  SHORTLISTED: ["SUPPLIER_IDENTIFIED", "REJECTED", "ARCHIVED"],
  SUPPLIER_IDENTIFIED: ["VERIFICATION_PENDING", "REJECTED", "ARCHIVED"],
  VERIFICATION_PENDING: ["APPROVED_FOR_SOURCING", "REJECTED", "ARCHIVED"],
  APPROVED_FOR_SOURCING: ["STOCK_VERIFIED", "REJECTED", "ARCHIVED"],
  STOCK_VERIFIED: ["READY_TO_PUBLISH", "REJECTED", "ARCHIVED"],
  READY_TO_PUBLISH: ["REJECTED", "ARCHIVED"],
  REJECTED: ["SHORTLISTED", "ARCHIVED"],
  ARCHIVED: ["SHORTLISTED"],
};

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function escapeLike(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export function normalizeMeeshoUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  if (host !== "meesho.com" && host !== "www.meesho.com") return null;
  if (url.pathname === "/" || url.pathname === "") return null;
  url.hash = "";
  return `${url.origin}${url.pathname}${url.search}`;
}

export function allowedTransitions(status: WorkflowStatus) {
  return transitions[status];
}

export function assertTransitionAllowed(
  current: WorkflowStatus,
  next: WorkflowStatus,
  permissionsState: {
    resaleAuthorization: PermissionStatus;
    authenticityStatus: PermissionStatus;
    imagePermission: PermissionStatus;
  },
) {
  if (!allowedTransitions(current).includes(next)) {
    throw new ValidationError("That status change is not available from the current step.");
  }
  if (next === "APPROVED_FOR_SOURCING") {
    if (permissionsState.resaleAuthorization !== "GRANTED") {
      throw new ValidationError("Resale authorization must be granted before this can be approved for sourcing.");
    }
    if (permissionsState.authenticityStatus === "DENIED") {
      throw new ValidationError("Authenticity was denied. This cannot be approved for sourcing.");
    }
  }
  if (next === "READY_TO_PUBLISH") {
    if (
      permissionsState.resaleAuthorization !== "GRANTED" ||
      permissionsState.authenticityStatus !== "GRANTED" ||
      permissionsState.imagePermission !== "GRANTED"
    ) {
      throw new ValidationError(
        "Resale, authenticity, and image permission must all be granted before this is ready to publish. This still does not list the product on the shop.",
      );
    }
  }
}

export function draftFromForm(formData: FormData): SourcingDraft {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    referenceName: read("referenceName"),
    meeshoUrl: read("meeshoUrl"),
    referenceBrand: read("referenceBrand"),
    department: read("department"),
    subcategory: read("subcategory"),
    referencePrice: read("referencePrice"),
    lastCheckedOn: read("lastCheckedOn"),
    supplierName: read("supplierName"),
    supplierContact: read("supplierContact"),
    supplierReference: read("supplierReference"),
    wholesaleCost: read("wholesaleCost"),
    minimumOrderQuantity: read("minimumOrderQuantity"),
    deliveryTime: read("deliveryTime"),
    resaleAuthorization: read("resaleAuthorization"),
    authenticityStatus: read("authenticityStatus"),
    imagePermission: read("imagePermission"),
    documentationReference: read("documentationReference"),
    internalNotes: read("internalNotes"),
  };
}

export function parseSourcingDraft(draft: SourcingDraft): SourcingInput {
  const fieldErrors: Record<string, string> = {};

  const referenceName = draft.referenceName.trim();
  if (referenceName.length < 2 || referenceName.length > 160) {
    fieldErrors.referenceName = "Enter a reference name between 2 and 160 characters.";
  }

  const meeshoUrl = normalizeMeeshoUrl(draft.meeshoUrl);
  if (!meeshoUrl) {
    fieldErrors.meeshoUrl = "Enter a Meesho product URL, including https:// and a product path.";
  }

  const referenceBrand = optionalText(draft.referenceBrand, "referenceBrand", 120, fieldErrors);
  const department = parseDepartment(draft.department, fieldErrors);
  const subcategory = draft.subcategory.trim();
  if (!department) {
    fieldErrors.department = "Choose a department.";
  } else if (!subcategoriesFor(department).includes(subcategory)) {
    fieldErrors.subcategory = "Choose a subcategory for this department.";
  }

  const referencePriceInr = optionalWholeRupees(draft.referencePrice, "referencePrice", fieldErrors);
  const wholesaleCostInr = optionalWholeRupees(draft.wholesaleCost, "wholesaleCost", fieldErrors);
  const lastCheckedOn = optionalDate(draft.lastCheckedOn, fieldErrors);
  const minimumOrderQuantity = optionalQuantity(draft.minimumOrderQuantity, fieldErrors);

  const resaleAuthorization = parsePermission(draft.resaleAuthorization, "resaleAuthorization", fieldErrors);
  const authenticityStatus = parsePermission(draft.authenticityStatus, "authenticityStatus", fieldErrors);
  const imagePermission = parsePermission(draft.imagePermission, "imagePermission", fieldErrors);
  const supplierName = optionalText(draft.supplierName, "supplierName", 500, fieldErrors);
  const supplierContact = optionalText(draft.supplierContact, "supplierContact", 500, fieldErrors);
  const supplierReference = optionalText(draft.supplierReference, "supplierReference", 500, fieldErrors);
  const deliveryTime = optionalText(draft.deliveryTime, "deliveryTime", 120, fieldErrors);
  const documentationReference = optionalText(draft.documentationReference, "documentationReference", 500, fieldErrors);
  const internalNotes = optionalText(draft.internalNotes, "internalNotes", 4000, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError("Check the highlighted fields.", fieldErrors);
  }
  if (!department || !meeshoUrl || !resaleAuthorization || !authenticityStatus || !imagePermission) {
    throw new ValidationError("Check the highlighted fields.", fieldErrors);
  }

  return {
    referenceName,
    meeshoUrl,
    referenceBrand,
    department,
    subcategory,
    referencePriceInr,
    referencePriceUnverified: true,
    lastCheckedOn,
    supplierName,
    supplierContact,
    supplierReference,
    wholesaleCostInr,
    minimumOrderQuantity,
    deliveryTime,
    resaleAuthorization,
    authenticityStatus,
    imagePermission,
    documentationReference,
    internalNotes,
  };
}

export function parseSourcingQuery(input: {
  q?: string;
  department?: string;
  subcategory?: string;
  status?: string;
  archived?: string;
  page?: string;
  pageSize?: string;
}): SourcingQuery {
  const department = isDepartment(input.department) ? input.department : null;
  const subcategory = input.subcategory?.trim() ?? "";
  const knownSubcategory = Object.values(sourcingCategories).some((items) => items.includes(subcategory));
  const status = isWorkflow(input.status) ? input.status : null;
  const page = positiveInt(input.page, 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, positiveInt(input.pageSize, DEFAULT_PAGE_SIZE));
  return {
    query: (input.q ?? "").trim().slice(0, 120),
    department,
    subcategory: knownSubcategory ? subcategory : null,
    status,
    includeArchived: input.archived === "1" || status === "ARCHIVED",
    page,
    pageSize,
  };
}

function parseDepartment(value: string, fieldErrors: Record<string, string>): SourcingDepartment | null {
  if (isDepartment(value)) return value;
  fieldErrors.department = "Choose a department.";
  return null;
}

function isDepartment(value: string | undefined): value is SourcingDepartment {
  return value === "MEN" || value === "WOMEN" || value === "ACCESSORIES";
}

function isWorkflow(value: string | undefined): value is WorkflowStatus {
  return workflow.includes(value as WorkflowStatus);
}

export function parseWorkflowStatus(value: string | undefined | null): WorkflowStatus | null {
  if (!value || !isWorkflow(value)) return null;
  return value;
}

function parsePermission(value: string, field: string, fieldErrors: Record<string, string>): PermissionStatus | null {
  const next = value.trim() || "NOT_PROVIDED";
  if (permissions.includes(next as PermissionStatus)) return next as PermissionStatus;
  fieldErrors[field] = "Choose a status.";
  return null;
}

function optionalText(value: string, field: string, max: number, fieldErrors: Record<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) {
    fieldErrors[field] = `Use ${max} characters or fewer.`;
    return null;
  }
  return trimmed;
}

function optionalWholeRupees(value: string, field: string, fieldErrors: Record<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[1-9][0-9]*$/.test(trimmed)) {
    fieldErrors[field] = "Enter a whole rupee amount, without commas or paise.";
    return null;
  }
  const amount = Number(trimmed);
  if (!Number.isSafeInteger(amount) || amount > MAX_PRICE) {
    fieldErrors[field] = "Enter a smaller whole rupee amount.";
    return null;
  }
  return amount;
}

function optionalQuantity(value: string, fieldErrors: Record<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[1-9][0-9]*$/.test(trimmed)) {
    fieldErrors.minimumOrderQuantity = "Enter a whole number of units.";
    return null;
  }
  const amount = Number(trimmed);
  if (!Number.isSafeInteger(amount) || amount > MAX_MOQ) {
    fieldErrors.minimumOrderQuantity = "Enter a smaller quantity.";
    return null;
  }
  return amount;
}

function optionalDate(value: string, fieldErrors: Record<string, string>) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    fieldErrors.lastCheckedOn = "Enter a valid date.";
    return null;
  }
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fieldErrors.lastCheckedOn = "Enter a valid date.";
    return null;
  }
  return trimmed;
}

function positiveInt(value: string | undefined, fallback: number) {
  if (!value || !/^[1-9][0-9]*$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return parsed;
}
