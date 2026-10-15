import type { PermissionStatus, WorkflowStatus } from "@/lib/sourcing/types";

export const workflowLabels: Record<WorkflowStatus, string> = {
  SHORTLISTED: "Shortlisted",
  SUPPLIER_IDENTIFIED: "Supplier identified",
  VERIFICATION_PENDING: "Verification pending",
  APPROVED_FOR_SOURCING: "Approved for sourcing",
  STOCK_VERIFIED: "Stock verified",
  READY_TO_PUBLISH: "Ready to publish",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

export const transitionLabels: Record<WorkflowStatus, string> = {
  SHORTLISTED: "Return to shortlist",
  SUPPLIER_IDENTIFIED: "Mark supplier identified",
  VERIFICATION_PENDING: "Send to verification",
  APPROVED_FOR_SOURCING: "Approve for sourcing",
  STOCK_VERIFIED: "Mark stock verified",
  READY_TO_PUBLISH: "Mark ready to publish",
  REJECTED: "Reject",
  ARCHIVED: "Archive",
};

export const permissionLabels: Record<PermissionStatus, string> = {
  NOT_PROVIDED: "Not provided",
  PENDING: "Pending",
  GRANTED: "Granted",
  DENIED: "Denied",
};

export const departmentLabels = {
  MEN: "Men",
  WOMEN: "Women",
  ACCESSORIES: "Accessories",
} as const;

export const sourcingNotices = {
  created: "Reference saved. It is not listed on the shop.",
  saved: "Changes saved.",
  updated: "Status updated. The shop is unchanged.",
  archived: "Record archived.",
} as const;

export function formatCheckedDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
