import { loginService } from '../login.service';
import { userRepository } from '../../../user.repository';
import { authRepository } from '../../auth.repository';
import { comparePassword } from '../../../../../core/auth/password-utils';
import { InvocationContext } from '@azure/functions';
import { seatService } from '../../../../seats/seat.service';

jest.mock('../../../user.repository', () => ({
    userRepository: {
        findByEmail: jest.fn()
    }
}));

jest.mock('../../auth.repository', () => ({
    authRepository: {
        create: jest.fn(),
        findActiveByEmail: jest.fn(),
        update: jest.fn()
    }
}));

jest.mock('../../../../../core/auth/password-utils', () => ({
    comparePassword: jest.fn()
}));

jest.mock('../../../../seats/seat.service', () => ({
    seatService: {
        assignUserToSeat: jest.fn()
    }
}));

describe('LoginService', () => {
    let mockContext: InvocationContext;

    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            log: jest.fn(),
            error: jest.fn()
        } as unknown as InvocationContext;
    });

    describe('login', () => {
        it('should initiate login successfully', async () => {
            const data = { email: 'test@example.com', password: 'password123' };
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                passwordHash: 'hashed_pw',
                isVerified: true
            };

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (comparePassword as jest.Mock).mockResolvedValue(true);
            (authRepository.create as jest.Mock).mockResolvedValue({});

            const result = await loginService.login(data as any, mockContext);

            expect(result.status).toBe(200);
            expect(authRepository.create).toHaveBeenCalled();
            expect(mockContext.log).toHaveBeenCalledWith(expect.stringContaining('Zasílám 2FA kód'));
        });

        it('should return 401 if user not found', async () => {
            const data = { email: 'wrong@example.com', password: 'password123' };
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);

            const result = await loginService.login(data as any, mockContext);

            expect(result.status).toBe(401);
            expect(authRepository.create).not.toHaveBeenCalled();
        });

        it('should return 401 if password incorrect', async () => {
            const data = { email: 'test@example.com', password: 'wrong' };
            const mockUser = { id: 'u1', email: 'test@example.com', passwordHash: 'h', isVerified: true };

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (comparePassword as jest.Mock).mockResolvedValue(false);

            const result = await loginService.login(data as any, mockContext);

            expect(result.status).toBe(401);
            expect(authRepository.create).not.toHaveBeenCalled();
        });

        it('should update existing session if one exists and is inactive', async () => {
            const data = { email: 'test@example.com', password: 'password123' };
            const mockUser = { id: 'u1', email: 'test@example.com', passwordHash: 'h', isVerified: true };
            const existingSession = { id: 's1', email: 'test@example.com', isActive: false, attempts: 2 };

            (userRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
            (comparePassword as jest.Mock).mockResolvedValue(true);
            (authRepository.findActiveByEmail as jest.Mock).mockResolvedValue(existingSession);
            (authRepository.update as jest.Mock).mockResolvedValue({});

            const result = await loginService.login(data as any, mockContext);

            expect(result.status).toBe(200);
            expect(authRepository.update).toHaveBeenCalledWith('s1', expect.objectContaining({
                attempts: 5,
                id: 's1'
            }));
            expect(authRepository.create).not.toHaveBeenCalled();
            expect(mockContext.log).toHaveBeenCalledWith(expect.stringContaining('Aktualizována stávající session'));
        });
    });

    describe('verify2fa', () => {
        it('should verify 2FA successfully and return token', async () => {
            const data = { email: 'test@example.com', code: '123456' };
            const mockSession = {
                id: 'session-123',
                email: 'test@example.com',
                code2fa: '123456',
                isActive: false,
                expiresAt: new Date(Date.now() + 10000).toISOString()
            };

            (authRepository.findActiveByEmail as jest.Mock).mockResolvedValue(mockSession);
            (authRepository.update as jest.Mock).mockResolvedValue({});

            const result = await loginService.verify2fa(data as any, mockContext);

            expect(result.status).toBe(200);
            expect(result.token).toBeDefined();
            expect(authRepository.update).toHaveBeenCalled();
        });

        it('should verify 2FA successfully and assign SeatId if provided', async () => {
            const data = { email: 'test@example.com', code: '123456' };
            const seatId = 'seat-456';
            const mockSession = {
                id: 'session-123',
                userId: 'user-123',
                email: 'test@example.com',
                code2fa: '123456',
                isActive: false,
                expiresAt: new Date(Date.now() + 10000).toISOString()
            };

            (authRepository.findActiveByEmail as jest.Mock).mockResolvedValue(mockSession);
            (authRepository.update as jest.Mock).mockResolvedValue({});
            (seatService.assignUserToSeat as jest.Mock).mockResolvedValue(undefined);

            const result = await loginService.verify2fa(data as any, mockContext, seatId);

            expect(result.status).toBe(200);
            expect(seatService.assignUserToSeat).toHaveBeenCalledWith(seatId, mockSession.userId);
            expect(mockContext.log).toHaveBeenCalledWith(expect.stringContaining('Assigned UserId'));
        });

        it('should return 401 if session not found', async () => {
            const data = { email: 'test@example.com', code: '000000' };
            (authRepository.findActiveByEmail as jest.Mock).mockResolvedValue(null);

            const result = await loginService.verify2fa(data as any, mockContext);

            expect(result.status).toBe(401);
        });

        it('should return 401 if session expired', async () => {
            const data = { email: 'test@example.com', code: '123456' };
            const mockSession = {
                id: 's1',
                email: 'test@example.com',
                code2fa: '123456',
                isActive: false,
                attempts: 5,
                expiresAt: new Date(Date.now() - 10000).toISOString()
            } as any;

            (authRepository.findActiveByEmail as jest.Mock).mockResolvedValue(mockSession);

            const result = await loginService.verify2fa(data as any, mockContext);

            expect(result.status).toBe(401);
            expect(result.message).toContain('expired');
        });
    });
});
