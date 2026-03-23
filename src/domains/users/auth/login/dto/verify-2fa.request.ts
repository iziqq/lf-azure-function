import * as v from "valibot";

export const Verify2faRequestSchema = v.object({
  email: v.pipe(v.string(), v.email("Neplatný formát emailu")),
  code: v.pipe(v.string(), v.length(6, "Kód musí mít přesně 6 číslic"), v.digits("Kód musí obsahovat pouze číslice"))
});

export type Verify2faRequest = v.InferOutput<typeof Verify2faRequestSchema>;
