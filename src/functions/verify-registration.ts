import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { initI18n } from "../core/i18n/i18n";
import { registerService } from "../domains/users/auth/registration/register.service";
import { withSeatId } from "../domains/seats/seat.middleware";

export async function verifyRegistration(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Verification function processed request for url "${request.url}"`);

    const t = await initI18n();
    const userId = request.query.get('userId');

    if (!userId) {
        return {
            status: 400,
            jsonBody: {
                message: t.t("auth.registration.invalid_data")
            }
        };
    }

    try {
        const result = await registerService.verify(userId, context);

        return {
            status: result.status,
            jsonBody: {
                message: result.message
            }
        };
    } catch (error: any) {
        context.error(`Error during user verification: ${error.message}`);
        return {
            status: 500,
            jsonBody: {
                message: t.t("auth.registration.verification.error")
            }
        };
    }
}

app.http('verify-registration', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'auth/registration/verify',
    handler: (request, context) => withSeatId(request, context, verifyRegistration)
});
