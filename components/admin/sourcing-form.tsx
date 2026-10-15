"use client";

import { useActionState, useState, type ReactNode } from "react";
import { subcategoriesFor } from "@/lib/sourcing/categories";
import { departmentLabels, permissionLabels } from "@/lib/sourcing/labels";
import { createSourcingAction, updateSourcingAction } from "@/lib/sourcing/actions";
import type { PermissionStatus, SourcingDepartment, SourcingDraft, SourcingRecord } from "@/lib/sourcing/types";
import { normalizeMeeshoUrl } from "@/lib/sourcing/validation";

const labelClass = "text-[11px] tracking-[0.16em] uppercase";
const inputClass = "mt-2 w-full border border-line bg-transparent px-3 py-2 outline-none";
const permissions: PermissionStatus[] = ["NOT_PROVIDED", "PENDING", "GRANTED", "DENIED"];

function emptyDraft(): SourcingDraft {
  return {
    referenceName: "",
    meeshoUrl: "",
    referenceBrand: "",
    department: "",
    subcategory: "",
    referencePrice: "",
    lastCheckedOn: "",
    supplierName: "",
    supplierContact: "",
    supplierReference: "",
    wholesaleCost: "",
    minimumOrderQuantity: "",
    deliveryTime: "",
    resaleAuthorization: "NOT_PROVIDED",
    authenticityStatus: "NOT_PROVIDED",
    imagePermission: "NOT_PROVIDED",
    documentationReference: "",
    internalNotes: "",
  };
}

function draftFromRecord(record: SourcingRecord): SourcingDraft {
  return {
    referenceName: record.referenceName,
    meeshoUrl: record.meeshoUrl,
    referenceBrand: record.referenceBrand ?? "",
    department: record.department,
    subcategory: record.subcategory,
    referencePrice: record.referencePriceInr ? String(record.referencePriceInr) : "",
    lastCheckedOn: record.lastCheckedOn ?? "",
    supplierName: record.supplierName ?? "",
    supplierContact: record.supplierContact ?? "",
    supplierReference: record.supplierReference ?? "",
    wholesaleCost: record.wholesaleCostInr ? String(record.wholesaleCostInr) : "",
    minimumOrderQuantity: record.minimumOrderQuantity ? String(record.minimumOrderQuantity) : "",
    deliveryTime: record.deliveryTime ?? "",
    resaleAuthorization: record.resaleAuthorization,
    authenticityStatus: record.authenticityStatus,
    imagePermission: record.imagePermission,
    documentationReference: record.documentationReference ?? "",
    internalNotes: record.internalNotes ?? "",
  };
}

export function SourcingForm({ record }: { record?: SourcingRecord }) {
  const action = record ? updateSourcingAction : createSourcingAction;
  const [state, formAction, pending] = useActionState(action, {});
  const [fields, setFields] = useState<SourcingDraft>(() => (record ? draftFromRecord(record) : emptyDraft()));
  const subcategories = subcategoriesFor(fields.department);
  const openUrl = normalizeMeeshoUrl(fields.meeshoUrl);

  function setField<Key extends keyof SourcingDraft>(key: Key, value: SourcingDraft[Key]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={formAction} className="mt-10" noValidate>
      {record ? <input type="hidden" name="id" value={record.id} /> : null}
      {state.formError ? (
        <p className="mb-6 text-sm" role="alert">
          {state.formError}
        </p>
      ) : null}

      <fieldset>
        <legend className={labelClass}>Reference</legend>
        <TextField
          id="reference-name"
          name="referenceName"
          label="Reference product name"
          value={fields.referenceName}
          error={state.fieldErrors?.referenceName}
          onChange={(value) => setField("referenceName", value)}
        />
        <TextField
          id="meesho-url"
          name="meeshoUrl"
          label="Meesho product URL"
          value={fields.meeshoUrl}
          error={state.fieldErrors?.meeshoUrl}
          hint="Checked as a link only. ZEVORA does not open or copy the page."
          spellCheck={false}
          onChange={(value) => setField("meeshoUrl", value)}
        />
        {openUrl ? (
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer noopener"
            referrerPolicy="no-referrer"
            className="mt-3 inline-block text-[11px] tracking-[0.16em] uppercase"
          >
            Open reference
          </a>
        ) : null}
        <TextField
          id="reference-brand"
          name="referenceBrand"
          label="Reference brand, if known"
          value={fields.referenceBrand}
          error={state.fieldErrors?.referenceBrand}
          onChange={(value) => setField("referenceBrand", value)}
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <SelectField
            id="department"
            name="department"
            label="Intended department"
            value={fields.department}
            error={state.fieldErrors?.department}
            onChange={(value) => {
              const options = subcategoriesFor(value);
              setFields((current) => ({
                ...current,
                department: value,
                subcategory: options.includes(current.subcategory) ? current.subcategory : "",
              }));
            }}
          >
            <option value="">Select</option>
            {(Object.keys(departmentLabels) as SourcingDepartment[]).map((department) => (
              <option key={department} value={department}>
                {departmentLabels[department]}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="subcategory"
            name="subcategory"
            label="Intended subcategory"
            value={fields.subcategory}
            error={state.fieldErrors?.subcategory}
            onChange={(value) => setField("subcategory", value)}
          >
            <option value="">Select</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory} value={subcategory}>
                {subcategory}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <TextField
            id="reference-price"
            name="referencePrice"
            label="Reference price, unverified"
            value={fields.referencePrice}
            error={state.fieldErrors?.referencePrice}
            hint="Whole rupees, entered by hand. This is not a checked shop price."
            inputMode="numeric"
            onChange={(value) => setField("referencePrice", value)}
          />
          <TextField
            id="last-checked"
            name="lastCheckedOn"
            label="Date last checked"
            type="date"
            value={fields.lastCheckedOn}
            error={state.fieldErrors?.lastCheckedOn}
            onChange={(value) => setField("lastCheckedOn", value)}
          />
        </div>
      </fieldset>

      <fieldset className="mt-12">
        <legend className={labelClass}>Supplier</legend>
        <TextField
          id="supplier-name"
          name="supplierName"
          label="Supplier name"
          value={fields.supplierName}
          error={state.fieldErrors?.supplierName}
          onChange={(value) => setField("supplierName", value)}
        />
        <AreaField
          id="supplier-contact"
          name="supplierContact"
          label="Supplier contact"
          value={fields.supplierContact}
          error={state.fieldErrors?.supplierContact}
          onChange={(value) => setField("supplierContact", value)}
        />
        <TextField
          id="supplier-reference"
          name="supplierReference"
          label="Supplier website or quotation reference"
          value={fields.supplierReference}
          error={state.fieldErrors?.supplierReference}
          onChange={(value) => setField("supplierReference", value)}
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <TextField
            id="wholesale-cost"
            name="wholesaleCost"
            label="Proposed wholesale cost"
            value={fields.wholesaleCost}
            error={state.fieldErrors?.wholesaleCost}
            hint="Whole rupees."
            inputMode="numeric"
            onChange={(value) => setField("wholesaleCost", value)}
          />
          <TextField
            id="minimum-order"
            name="minimumOrderQuantity"
            label="Expected minimum order"
            value={fields.minimumOrderQuantity}
            error={state.fieldErrors?.minimumOrderQuantity}
            inputMode="numeric"
            onChange={(value) => setField("minimumOrderQuantity", value)}
          />
          <TextField
            id="delivery-time"
            name="deliveryTime"
            label="Expected delivery time"
            value={fields.deliveryTime}
            error={state.fieldErrors?.deliveryTime}
            onChange={(value) => setField("deliveryTime", value)}
          />
        </div>
      </fieldset>

      <fieldset className="mt-12">
        <legend className={labelClass}>Authorization</legend>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <PermissionField
            id="resale-authorization"
            name="resaleAuthorization"
            label="Resale authorization"
            value={fields.resaleAuthorization}
            error={state.fieldErrors?.resaleAuthorization}
            onChange={(value) => setField("resaleAuthorization", value)}
          />
          <PermissionField
            id="authenticity-status"
            name="authenticityStatus"
            label="Authenticity verification"
            value={fields.authenticityStatus}
            error={state.fieldErrors?.authenticityStatus}
            onChange={(value) => setField("authenticityStatus", value)}
          />
          <PermissionField
            id="image-permission"
            name="imagePermission"
            label="Product image permission"
            value={fields.imagePermission}
            error={state.fieldErrors?.imagePermission}
            onChange={(value) => setField("imagePermission", value)}
          />
        </div>
        <TextField
          id="documentation-reference"
          name="documentationReference"
          label="Supplier invoice or documentation reference"
          value={fields.documentationReference}
          error={state.fieldErrors?.documentationReference}
          onChange={(value) => setField("documentationReference", value)}
        />
      </fieldset>

      <fieldset className="mt-12">
        <legend className={labelClass}>Notes</legend>
        <AreaField
          id="internal-notes"
          name="internalNotes"
          label="Internal notes"
          value={fields.internalNotes}
          error={state.fieldErrors?.internalNotes}
          onChange={(value) => setField("internalNotes", value)}
        />
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="mt-10 h-11 bg-ink px-8 text-[11px] tracking-[0.18em] text-ivory uppercase hover:bg-charcoal disabled:opacity-60"
      >
        {pending ? "Saving" : "Save reference"}
      </button>
    </form>
  );
}

function TextField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  inputMode,
  spellCheck,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  inputMode?: "numeric";
  spellCheck?: boolean;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="mt-6">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-charcoal">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        inputMode={inputMode}
        spellCheck={spellCheck}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AreaField({
  id,
  name,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="mt-6">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        rows={4}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  children,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        {children}
      </select>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PermissionField({
  id,
  name,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <SelectField id={id} name={name} label={label} value={value} error={error} onChange={onChange}>
      {permissions.map((status) => (
        <option key={status} value={status}>
          {permissionLabels[status]}
        </option>
      ))}
    </SelectField>
  );
}
