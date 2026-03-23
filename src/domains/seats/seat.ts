export interface Seat {
    id: string; // Toto bude SeatId (GUID)
    createdAt: string;
    requestCount: number;
    userId?: string;
}
