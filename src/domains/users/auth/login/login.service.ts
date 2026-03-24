import { InvocationContext } from "@azure/functions";
import { LoginRequest } from "./dto/login.request";
import { userRepository } from "../../user.repository";
import { comparePassword } from "../../../../core/auth/password-utils";
import { authRepository } from "../auth.repository";
import { AuthSession } from "../auth-session";
import { Verify2faRequest } from "./dto/verify-2fa.request";
import { seatService } from "../../../seats/seat.service";
import { initI18n } from "../../../../core/i18n/i18n";
import { sendEmail } from "../../../../core/smtp/email.provider";
import { SupportedLanguages } from "../../../../core/enum/supported-languages.enum";

export class LoginService {
    async login(data: LoginRequest, context: InvocationContext) {
        const { email, password } = data;
        const t = await initI18n();

        // Kontrola, zda uživatel není blokován (z jakékoliv neaktivní relace)
        const lastSession = await authRepository.findActiveByEmail(email);
        if (lastSession?.blockedUntil && new Date(lastSession.blockedUntil) > new Date()) {
            return {
                status: 403,
                message: t.t("auth.login.blocked", { blockedUntil: lastSession.blockedUntil })
            };
        }

        const user = await userRepository.findByEmail(email);
        if (!user || !user.isVerified) {
            return {
                status: 401,
                message: t.t("auth.login.invalid_credentials")
            };
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return {
                status: 401,
                message: t.t("auth.login.invalid_credentials")
            };
        }

        if (user.language) {
            const lng = user.language === SupportedLanguages.CZ ? 'cs' : 'en';
            await t.changeLanguage(lng);
        }

        context.log(`Přihlašování uživatele: ${email}`);

        // Generování 2FA kódu
        const code2fa = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Pokud již existuje neaktivní session (čekající na 2FA), přepíšeme ji
        if (lastSession && !lastSession.isActive) {
            const updatedSession: AuthSession = {
                ...lastSession,
                code2fa,
                attempts: 5, // Reset pokusů
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Reset expirace na 15 minut
            };
            
            await authRepository.update(lastSession.id, updatedSession);
            context.log(`Aktualizována stávající session pro: ${email}`);
        } else {
            // Vytvoření nové session, pokud neexistuje nebo je již aktivní (přihlášená)
            const session: AuthSession = {
                id: crypto.randomUUID(),
                userId: user.id,
                email: user.email,
                code2fa,
                attempts: 5,
                isActive: false,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 120 * 60 * 1000).toISOString() // 120 minut platnost
            };

            await authRepository.create(session);
            context.log(`Vytvořena nová session pro: ${email}`);
        }

        // Odeslání 2FA kódu na e-mail
        const subject = t.t("auth.login.2fa_email_subject");
        const body = t.t("auth.login.2fa_email_body", { code: code2fa });
        
        context.log(`E-mail 2FA pro ${email}: Subject: ${subject}, Body: ${body}`);

        await sendEmail({
            to: email,
            subject: subject,
            body: body
        }, context);

        return {
            status: 200,
            message: t.t("auth.login.initial_success")
        };
    }

    async verify2fa(data: Verify2faRequest, context: InvocationContext, seatId: string | null = null) {
        const { email, code } = data;
        const t = await initI18n();

        const session = await authRepository.findActiveByEmail(email);

        if (!session) {
            return {
                status: 401,
                message: t.t("auth.login.invalid_session")
            };
        }

        // Kontrola blokování
        if (session.blockedUntil && new Date(session.blockedUntil) > new Date()) {
            return {
                status: 403,
                message: t.t("auth.login.blocked", { blockedUntil: session.blockedUntil })
            };
        }

        // Kontrola expirace
        if (new Date(session.expiresAt) < new Date()) {
            return {
                status: 401,
                message: t.t("auth.login.code_expired")
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
                    message: t.t("auth.login.too_many_attempts")
                };
            }

            return {
                status: 401,
                message: t.t("auth.login.invalid_code", { attempts: remainingAttempts })
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

        if (seatId) {
            await seatService.assignUserToSeat(seatId, session.userId);
            context.log(`Assigned UserId ${session.userId} to SeatId ${seatId}`);
        }

        return {
            status: 200,
            message: t.t("auth.login.success"),
            token: token
        };
    }
}

export const loginService = new LoginService();
