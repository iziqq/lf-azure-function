import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { seatService } from "./seat.service";
import { initI18n } from "../../core/i18n/i18n";

export async function withSeatId(
    request: HttpRequest,
    context: InvocationContext,
    handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>
): Promise<HttpResponseInit> {
    const t = await initI18n();
    const seatId = request.headers.get('x-seat-id');

    const isValid = await seatService.validateAndTrackSeat(seatId, context);

    if (!isValid) {
        return {
            status: 401,
            jsonBody: {
                message: t.t("auth.seat.missing_or_invalid")
            }
        };
    }

    return handler(request, context);
}
