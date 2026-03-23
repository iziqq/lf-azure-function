import { seatService } from '../seat.service';
import { seatRepository } from '../seat.repository';
import { InvocationContext } from '@azure/functions';

jest.mock('../seat.repository', () => ({
    seatRepository: {
        create: jest.fn(),
        findById: jest.fn(),
        incrementRequestCount: jest.fn(),
        assignUserId: jest.fn()
    }
}));

describe('SeatService', () => {
    let mockContext: InvocationContext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            log: jest.fn(),
            error: jest.fn()
        } as unknown as InvocationContext;
    });

    describe('registerSeat', () => {
        it('should register a new seat', async () => {
            const seatId = 'guid-123';
            const mockSeat = { id: seatId, createdAt: new Date().toISOString(), requestCount: 0 };
            (seatRepository.create as jest.Mock).mockResolvedValue(mockSeat);

            const result = await seatService.registerSeat(seatId, mockContext);

            expect(result.id).toBe(seatId);
            expect(seatRepository.create).toHaveBeenCalledWith(expect.objectContaining({ id: seatId }));
            expect(mockContext.log).toHaveBeenCalledWith(expect.stringContaining('Registered new SeatId'));
        });
    });

    describe('validateAndTrackSeat', () => {
        it('should return true and increment count for valid seatId', async () => {
            const seatId = 'valid-id';
            (seatRepository.findById as jest.Mock).mockResolvedValue({ id: seatId });
            (seatRepository.incrementRequestCount as jest.Mock).mockResolvedValue(undefined);

            const result = await seatService.validateAndTrackSeat(seatId, mockContext);

            expect(result).toBe(true);
            expect(seatRepository.incrementRequestCount).toHaveBeenCalledWith(seatId);
        });

        it('should return false for null seatId', async () => {
            const result = await seatService.validateAndTrackSeat(null, mockContext);
            expect(result).toBe(false);
        });

        it('should return false if seat not found in DB', async () => {
            (seatRepository.findById as jest.Mock).mockResolvedValue(null);
            const result = await seatService.validateAndTrackSeat('unknown', mockContext);
            expect(result).toBe(false);
        });
    });
});
