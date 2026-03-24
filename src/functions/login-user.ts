import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseEntity } from "../core/parser/entity-parser";
import { LoginRequestSchema } from "../domains/users/auth/login/dto/login.request";
import { loginService } from "../domains/users/auth/login/login.service";
import { withSeatId } from "../domains/seats/seat.middleware";
import { initI18n } from "../core/i18n/i18n";

export async function loginUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const t = await initI18n();

    const body = await request.json() as any;
    const parseResult = parseEntity(body, LoginRequestSchema);

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

    const result = await loginService.login(parseResult.value, context);

    return {
        status: result.status,
        jsonBody: {
            message: result.message
        }
    };
};

app.http('login-user', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'auth/login',
    handler: (request, context) => withSeatId(request, context, loginUser)
});
