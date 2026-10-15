export type SourcingDepartment = "MEN" | "WOMEN" | "ACCESSORIES";

export type PermissionStatus = "NOT_PROVIDED" | "PENDING" | "GRANTED" | "DENIED";

export type WorkflowStatus =
  | "SHORTLISTED"
  | "SUPPLIER_IDENTIFIED"
  | "VERIFICATION_PENDING"
  | "APPROVED_FOR_SOURCING"
  | "STOCK_VERIFIED"
  | "READY_TO_PUBLISH"
  | "REJECTED"
  | "ARCHIVED";

export type SourcingRecord = {
  id: string;
  referenceName: string;
  meeshoUrl: string;
  referenceBrand: string | null;
  department: SourcingDepartment;
  subcategory: string;
  referencePriceInr: number | null;
  referencePriceUnverified: true;
  lastCheckedOn: string | null;
  supplierName: string | null;
  supplierContact: string | null;
  supplierReference: string | null;
  wholesaleCostInr: number | null;
  minimumOrderQuantity: number | null;
  deliveryTime: string | null;
  resaleAuthorization: PermissionStatus;
  authenticityStatus: PermissionStatus;
  imagePermission: PermissionStatus;
  documentationReference: string | null;
  internalNotes: string | null;
  workflowStatus: WorkflowStatus;
  archivedFromStatus: WorkflowStatus | null;
  createdAt: string;
  updatedAt: string;
};

export type SourcingDraft = {
  referenceName: string;
  meeshoUrl: string;
  referenceBrand: string;
  department: string;
  subcategory: string;
  referencePrice: string;
  lastCheckedOn: string;
  supplierName: string;
  supplierContact: string;
  supplierReference: string;
  wholesaleCost: string;
  minimumOrderQuantity: string;
  deliveryTime: string;
  resaleAuthorization: string;
  authenticityStatus: string;
  imagePermission: string;
  documentationReference: string;
  internalNotes: string;
};

export type SourcingInput = Omit<
  SourcingRecord,
  "id" | "createdAt" | "updatedAt" | "workflowStatus" | "archivedFromStatus"
>;

export type SourcingQuery = {
  query: string;
  department: SourcingDepartment | null;
  subcategory: string | null;
  status: WorkflowStatus | null;
  includeArchived: boolean;
  page: number;
  pageSize: number;
};

export type SourcingPage = {
  records: SourcingRecord[];
  total: number;
  page: number;
  pageSize: number;
};
