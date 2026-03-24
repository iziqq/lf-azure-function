import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseEntity } from "../core/parser/entity-parser";
import { RegisterRequestSchema } from "../domains/users/auth/registration/dto/register.request";
import { initI18n } from "../core/i18n/i18n";
import { registerService } from "../domains/users/auth/registration/register.service";
import { withSeatId } from "../domains/seats/seat.middleware";

export async function registerUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const t = await initI18n();
    const body = await request.json() as any;

    const lng = body?.language || 'cs-CZ';
    await t.changeLanguage(lng);

    const parseResult = parseEntity(body, RegisterRequestSchema);

    if (!parseResult.valid) {
        return {
            status: 400,
            jsonBody: {
                message: t.t("auth.registration.invalid_data"),
                errors: parseResult.issues.map(issue => ({
                    ...issue,
                    message: t.t(issue.message)
                }))
            }
        };
    }

    try {
        const result = await registerService.register(parseResult.value, request.url, context);

        return {
            status: 201,
            jsonBody: {
                message: result.message,
                userId: result.userId
            }
        };
    } catch (error: any) {
        if (error?.name === 'DuplicateEmailError') {
            return {
                status: 409,
                jsonBody: {
                    message: t.t(error.message)
                }
            };
        }
        context.error(`Chyba při ukládání uživatele: ${error.message}`, error);
        return {
            status: 500,
            jsonBody: {
                message: t.t("auth.registration.error"),
                error: error.message
            }
        };
    }
};

app.http('register-user', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'auth/register',
    handler: (request, context) => withSeatId(request, context, registerUser)
});
