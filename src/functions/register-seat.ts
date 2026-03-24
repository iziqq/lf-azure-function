import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { seatService } from "../domains/seats/seat.service";
import { parseEntity } from "../core/parser/entity-parser";
import { SeatRegisterRequestSchema } from "../domains/seats/dto/seat-register.request";
import { initI18n } from "../core/i18n/i18n";

export async function registerSeat(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (request.method === 'OPTIONS') {
        return {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-seat-id'
            }
        };
    }

    context.log(`Registering new seatId for url "${request.url}"`);
    const t = await initI18n();

    try {
        const body = await request.json() as any;
        const parseResult = parseEntity(body, SeatRegisterRequestSchema);

        if (!parseResult.valid) {
            return {
                status: 400,
                jsonBody: {
                    message: t.t("auth.seat.invalid_data"),
                    errors: parseResult.issues
                },
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, x-seat-id'
                }
            };
        }

        const seat = await seatService.registerSeat(parseResult.value.seatId, context);

        const response: HttpResponseInit = {
            status: 201,
            jsonBody: {
                seatId: seat.id,
                message: t.t("auth.seat.registration_success")
            }
        };

        return {
            ...response,
            headers: {
                ...response.headers,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-seat-id'
            }
        };
    } catch (error: any) {
        context.error(`Error registering seat: ${error.message}`);
        return {
            status: 500,
            jsonBody: {
                message: t.t("auth.seat.registration_error")
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-seat-id'
            }
        };
    }
};

app.http('register-seat', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'seats/register',
    handler: registerSeat
});
