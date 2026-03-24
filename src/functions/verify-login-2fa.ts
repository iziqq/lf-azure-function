import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseEntity } from "../core/parser/entity-parser";
import { Verify2faRequestSchema } from "../domains/users/auth/login/dto/verify-2fa.request";
import { loginService } from "../domains/users/auth/login/login.service";
import { withSeatId } from "../domains/seats/seat.middleware";
import { initI18n } from "../core/i18n/i18n";

export async function verifyLogin2fa(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const t = await initI18n();

    const body = await request.json() as any;
    const parseResult = parseEntity(body, Verify2faRequestSchema);

    if (!parseResult.valid) {
        return {
            status: 400,
            jsonBody: {
                message: t.t("auth.login.invalid_data"),
                errors: parseResult.issues.map(issue => ({
                    ...issue,
                    message: t.t(issue.message)
                }))
            }
        };
    }

    try {
        const seatId = request.headers.get('x-seat-id');
        const result = await loginService.verify2fa(parseResult.value, context, seatId);

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
                message: t.t("auth.login.error")
            }
        };
    }
};

app.http('verify-login-2fa', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'auth/login/2fa/verify',
    handler: (request, context) => withSeatId(request, context, verifyLogin2fa)
});
