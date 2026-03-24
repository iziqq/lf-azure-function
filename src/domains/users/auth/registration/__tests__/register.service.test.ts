import { registerService } from '../register.service';
import { userRepository } from '../../../user.repository';
import { initI18n } from '../../../../../core/i18n/i18n';
import { sendEmail } from '../../../../../core/smtp/email.provider';
import { InvocationContext } from '@azure/functions';

// Mockování závislostí
jest.mock('../../../user.repository', () => ({
    userRepository: {
        findByEmail: jest.fn(),
        create: jest.fn()
    }
}));

jest.mock('../../../../../core/i18n/i18n', () => ({
    initI18n: jest.fn()
}));

jest.mock('../../../../../core/smtp/email.provider', () => ({
    sendEmail: jest.fn()
}));

describe('RegisterService', () => {
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
        (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    });

    it('should register a new user successfully', async () => {
        const data = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Jan',
            lastName: 'Novak',
            language: 'cs-CZ'
        };

        (userRepository.create as jest.Mock).mockResolvedValue({
            id: 'uuid-123', email: data.email
        });

        const result = await registerService.register(data as any, 'http://localhost:7071/api/auth/register', mockContext);

        expect(result.userId).toBe('uuid-123');
        expect(result.message).toBe('auth.registration.success');
        expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
        expect(userRepository.create).toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalled();
    });

    it('should reject when email already exists', async () => {
        const data = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Jan',
            lastName: 'Novak'
        };

        (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 'x', email: data.email });

        await expect(registerService.register(data as any, 'http://localhost:7071/api/auth/register', mockContext))
            .rejects.toHaveProperty('name', 'DuplicateEmailError');
        expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when database saving fails', async () => {
        const data = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Jan',
            lastName: 'Novak'
        };

        (userRepository.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

        await expect(registerService.register(data as any, 'http://localhost:7071/api/auth/register', mockContext))
            .rejects.toThrow('DB Error');
    });
});
