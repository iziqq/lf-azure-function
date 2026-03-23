import { InvocationContext } from "@azure/functions";
import { LoginRequest } from "./dto/login.request";
import { userRepository } from "../../user.repository";
import { comparePassword } from "../../../../core/auth/password-utils";
import { authRepository } from "../auth.repository";
import { AuthSession } from "../auth-session";
import { Verify2faRequest } from "./dto/verify-2fa.request";

export class LoginService {
    async login(data: LoginRequest, context: InvocationContext) {
        const { email, password } = data;

        // Kontrola, zda uživatel není blokován (z jakékoliv neaktivní relace)
        const lastSession = await authRepository.findActiveByEmail(email);
        if (lastSession?.blockedUntil && new Date(lastSession.blockedUntil) > new Date()) {
            return {
                status: 403,
                message: `User is blocked until ${lastSession.blockedUntil}.`
            };
        }

        const user = await userRepository.findByEmail(email);
        if (!user || !user.isVerified) {
            return {
                status: 401,
                message: "Invalid credentials or user not verified."
            };
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return {
                status: 401,
                message: "Invalid credentials."
            };
        }

        context.log(`Přihlašování uživatele: ${email}`);

        // Generování 2FA kódu
        const code2fa = Math.floor(100000 + Math.random() * 900000).toString();
        
        const session: AuthSession = {
            id: crypto.randomUUID(),
            userId: user.id,
            email: user.email,
            code2fa,
            attempts: 5,
            isActive: false,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minut platnost
        };

        await authRepository.create(session);

        context.log(`[SIMULACE EMAILU] Zasílám 2FA kód ${code2fa} na email ${email}`);

        return {
            status: 200,
            message: "Login initial success. 2FA required."
        };
    }

    async verify2fa(data: Verify2faRequest, context: InvocationContext) {
        const { email, code } = data;

        const session = await authRepository.findActiveByEmail(email);

        if (!session) {
            return {
                status: 401,
                message: "Invalid session."
            };
        }

        // Kontrola blokování
        if (session.blockedUntil && new Date(session.blockedUntil) > new Date()) {
            return {
                status: 403,
                message: `User is blocked until ${session.blockedUntil}.`
            };
        }

        // Kontrola expirace
        if (new Date(session.expiresAt) < new Date()) {
            return {
                status: 401,
                message: "2FA code expired."
            };
        }

        // Kontrola kódu
        if (session.code2fa !== code) {
            const remainingAttempts = session.attempts - 1;
            const updatedSession: AuthSession = {
                ...session,
                attempts: remainingAttempts
            };

            if (remainingAttempts <= 0) {
                updatedSession.blockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minut blokace
            }

            await authRepository.update(session.id, updatedSession);

            if (remainingAttempts <= 0) {
                return {
                    status: 403,
                    message: "Too many failed attempts. User is blocked for 30 minutes."
                };
            }

            return {
                status: 401,
                message: `Invalid 2FA code. Remaining attempts: ${remainingAttempts}`
            };
        }

        const token = crypto.randomUUID(); // Bearer token

        const updatedSession: AuthSession = {
            ...session,
            isActive: true,
            token,
            updatedAt: new Date().toISOString()
        } as any;

        await authRepository.update(session.id, updatedSession);

        return {
            status: 200,
            message: "Login successful.",
            token: token
        };
    }
}

export const loginService = new LoginService();
