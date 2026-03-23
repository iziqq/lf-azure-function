import { InvocationContext } from "@azure/functions";
import { Seat } from "./seat";
import { seatRepository } from "./seat.repository";

export class SeatService {
    async registerSeat(seatId: string, context: InvocationContext): Promise<Seat> {
        const seat: Seat = {
            id: seatId,
            createdAt: new Date().toISOString(),
            requestCount: 0
        };

        const createdSeat = await seatRepository.create(seat);
        context.log(`Registered new SeatId: ${createdSeat.id}`);
        return createdSeat;
    }

    async validateAndTrackSeat(seatId: string | null, context: InvocationContext): Promise<boolean> {
        if (!seatId) {
            return false;
        }

        const seat = await seatRepository.findById(seatId);
        if (!seat) {
            return false;
        }

        await seatRepository.incrementRequestCount(seatId);
        return true;
    }

    async assignUserToSeat(seatId: string, userId: string): Promise<void> {
        await seatRepository.assignUserId(seatId, userId);
    }
}

export const seatService = new SeatService();
