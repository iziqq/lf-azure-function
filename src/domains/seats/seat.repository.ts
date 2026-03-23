import { getContainer } from "../../core/database/cosmos-client";
import { Seat } from "./seat";

const CONTAINER_ID = "Seats";

export class SeatRepository {
    async create(seat: Seat): Promise<Seat> {
        try {
            const container = await getContainer(CONTAINER_ID);
            const { resource } = await container.items.create(seat);
            if (!resource) {
                throw new Error("Failed to create seat in database: No resource returned");
            }
            return resource;
        } catch (error: any) {
            console.error(`SeatRepository.create error: ${error.message}`, error);
            throw error;
        }
    }

    async findById(id: string): Promise<Seat | null> {
        try {
            const container = await getContainer(CONTAINER_ID);
            const { resource } = await container.item(id, id).read<Seat>();
            return resource ?? null;
        } catch (error: any) {
            if (error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    async update(id: string, seat: Seat): Promise<Seat> {
        try {
            const container = await getContainer(CONTAINER_ID);
            const { resource } = await container.item(id, id).replace<Seat>(seat);
            if (!resource) {
                throw new Error("Failed to update seat in database");
            }
            return resource;
        } catch (error: any) {
            console.error(`SeatRepository.update error: ${error.message}`, error);
            throw error;
        }
    }

    async incrementRequestCount(id: string): Promise<void> {
        // V Cosmos DB by bylo ideální použít patch, ale pro jednoduchost a v souladu s ostatními repozitáři použijeme read -> update
        const seat = await this.findById(id);
        if (seat) {
            seat.requestCount += 1;
            await this.update(id, seat);
        }
    }

    async assignUserId(id: string, userId: string): Promise<void> {
        const seat = await this.findById(id);
        if (seat) {
            seat.userId = userId;
            await this.update(id, seat);
        }
    }
}

export const seatRepository = new SeatRepository();
