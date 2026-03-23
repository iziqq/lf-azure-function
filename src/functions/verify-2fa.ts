import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseEntity } from "../core/parser/entity-parser";
import { Verify2faRequestSchema } from "../domains/users/auth/login/dto/verify-2fa.request";
import { loginService } from "../domains/users/auth/login/login.service";

export async function verify2fa(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const body = await request.json() as any;
    const parseResult = parseEntity(body, Verify2faRequestSchema);

    if (!parseResult.valid) {
        return {
            status: 400,
            jsonBody: {
                message: "Neplatná data požadavku.",
                errors: parseResult.issues
            }
        };
    }

    try {
        const result = await loginService.verify2fa(parseResult.value, context);

        return {
            status: result.status,
            jsonBody: {
                message: result.message,
                token: result.token
            }
        };
    } catch (error: any) {
        context.error(`Error during 2FA verification: ${error.message}`);
        return {
            status: 500,
            jsonBody: {
                message: "Při ověřování 2FA kódu došlo k chybě."
            }
        };
    }
};

app.http('verify-2fa', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: verify2fa
});
