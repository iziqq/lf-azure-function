import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { seatService } from "./seat.service";
import { initI18n } from "../../core/i18n/i18n";

export async function withSeatId(
    request: HttpRequest,
    context: InvocationContext,
    handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>
): Promise<HttpResponseInit> {
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

    const t = await initI18n();
    const seatId = request.headers.get('x-seat-id');

    const isValid = await seatService.validateAndTrackSeat(seatId, context);

    if (!isValid) {
        return {
            status: 401,
            jsonBody: {
                message: t.t("auth.seat.missing_or_invalid")
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, x-seat-id'
            }
        };
    }

    const response = await handler(request, context);
    
    // Přidání CORS hlaviček ke každé odpovědi
    return {
        ...response,
        headers: {
            ...response.headers,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-seat-id'
        }
    };
}
