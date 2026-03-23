import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { seatService } from "../domains/seats/seat.service";
import { parseEntity } from "../core/parser/entity-parser";
import { SeatRegisterRequestSchema } from "../domains/seats/dto/seat-register.request";
import { initI18n } from "../core/i18n/i18n";

export async function registerSeat(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
                }
            };
        }

        const seat = await seatService.registerSeat(parseResult.value.seatId, context);

        return {
            status: 201,
            jsonBody: {
                seatId: seat.id,
                message: t.t("auth.seat.registration_success")
            }
        };
    } catch (error: any) {
        context.error(`Error registering seat: ${error.message}`);
        return {
            status: 500,
            jsonBody: {
                message: t.t("auth.seat.registration_error")
            }
        };
    }
};

app.http('registerSeat', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'seats/register',
    handler: registerSeat
});
