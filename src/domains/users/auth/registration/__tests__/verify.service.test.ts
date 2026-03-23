import { registerService } from '../register.service';
import { userRepository } from '../../../user.repository';
import { initI18n } from '../../../../../core/i18n/i18n';
import { InvocationContext } from '@azure/functions';

// Mockování závislostí
jest.mock('../../../user.repository', () => ({
    userRepository: {
        findById: jest.fn(),
        update: jest.fn()
    }
}));

jest.mock('../../../../../core/i18n/i18n', () => ({
    initI18n: jest.fn()
}));

describe('RegisterService - verify', () => {
    let mockContext: InvocationContext;
    let mockT: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            log: jest.fn(),
            error: jest.fn()
        } as unknown as InvocationContext;

        mockT = {
            t: jest.fn((key: string) => key),
            changeLanguage: jest.fn()
        };
        (initI18n as jest.Mock).mockResolvedValue(mockT);
    });

    it('should verify a user successfully', async () => {
        const userId = 'uuid-123';
        const mockUser = {
            id: userId,
            email: 'test@example.com',
            isVerified: false,
            language: 'cs-CZ'
        };

        (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
        (userRepository.update as jest.Mock).mockResolvedValue({});

        const result = await registerService.verify(userId, mockContext);

        expect(result.status).toBe(200);
        expect(result.message).toBe('auth.registration.verification.success');
        expect(mockT.changeLanguage).toHaveBeenCalledWith('cs-CZ');
    });

    it('should return 404 if user is not found', async () => {
        const userId = 'non-existent';

        (userRepository.findById as jest.Mock).mockResolvedValue(null);

        const result = await registerService.verify(userId, mockContext);

        expect(result.status).toBe(404);
        expect(result.message).toBe('auth.registration.verification.not_found');
    });

    it('should return 200 and message if already verified', async () => {
        const userId = 'uuid-123';
        const mockUser = {
            id: userId,
            email: 'test@example.com',
            isVerified: true,
            language: 'cs-CZ'
        };

        (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

        const result = await registerService.verify(userId, mockContext);

        expect(result.status).toBe(200);
        expect(result.message).toBe('auth.registration.verification.already_verified');
    });

    it('should throw error when database error occurs', async () => {
        const userId = 'uuid-123';

        (userRepository.findById as jest.Mock).mockRejectedValue(new Error('DB Error'));

        await expect(registerService.verify(userId, mockContext)).rejects.toThrow('DB Error');
    });
});
