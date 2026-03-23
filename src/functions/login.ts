import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { parseEntity } from "../core/parser/entity-parser";
import { LoginRequestSchema } from "../domains/users/auth/login/dto/login.request";
import { loginService } from "../domains/users/auth/login/login.service";

export async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const body = await request.json() as any;
    const parseResult = parseEntity(body, LoginRequestSchema);

    if (!parseResult.valid) {
        return {
            status: 400,
            jsonBody: {
                message: "Neplatná data požadavku.",
                errors: parseResult.issues
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

app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: login
});
