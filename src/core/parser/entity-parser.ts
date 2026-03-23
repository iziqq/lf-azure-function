import * as v from "valibot";

export type ParseResponse<T> = {
    valid: false;
    issues: v.BaseIssue<unknown>[]
} | {
    valid: true;
    value: T;
}

export function parseEntity<T, S extends v.BaseSchema<unknown, T, v.BaseIssue<unknown>>>(entity: T | null, schema: S): ParseResponse<T> {
    if (!entity) return { valid: false, issues: [] };

    const parseResult = v.safeParse(schema, entity);

    if (! parseResult.success)
        return { valid: false, issues: parseResult.issues };

    return { valid: true, value: parseResult.output as T };
}