"use client";

import { useActionState, useState } from "react";
import { saveCategoryAction, type ActionState } from "@/lib/commerce/actions";

export function CategoryForm({ departments }: { departments: { id: string; name: string; department: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCategoryAction, {});
  const [department, setDepartment] = useState(departments[0]?.department ?? "men");
  const parentId = departments.find((item) => item.department === department)?.id ?? "";
  return (
    <form action={action} className="mt-8 grid max-w-xl gap-3 border border-line p-4">
      <input type="hidden" name="parentId" value={parentId} />
      {state.error ? <p role="alert" className="text-sm">{state.error}</p> : null}
      {state.message ? <p role="status" className="text-sm">{state.message}</p> : null}
      <label className="text-[11px] tracking-[0.16em] uppercase">
        Department
        <select name="department" value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-2 w-full border border-line bg-transparent px-3 py-2">
          {departments.map((item) => (
            <option key={item.id} value={item.department}>{item.name}</option>
          ))}
        </select>
      </label>
      <label className="text-[11px] tracking-[0.16em] uppercase">
        Name
        <input name="name" className="mt-2 w-full border border-line bg-transparent px-3 py-2" required />
      </label>
      <label className="text-[11px] tracking-[0.16em] uppercase">
        Slug
        <input name="slug" className="mt-2 w-full border border-line bg-transparent px-3 py-2" required />
      </label>
      <button disabled={pending} className="h-11 bg-ink text-[11px] tracking-[0.16em] text-ivory uppercase disabled:bg-stone" type="submit">
        {pending ? "Adding" : "Add subcategory"}
      </button>
    </form>
  );
}
