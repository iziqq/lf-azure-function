import { InvocationContext } from "@azure/functions";
import { RegisterRequest } from "./dto/register.request";
import { User, UserRole } from "../../user";
import { userRepository } from "../../user.repository";
import { hashPassword } from "../../../../core/auth/password-utils";
import { initI18n } from "../../../../core/i18n/i18n";
import { sendEmail } from "../../../../core/smtp/email.provider";
import { SupportedLanguages } from "../../../../core/enum/supported-languages.enum";

export class RegisterService {
    async register(data: RegisterRequest, requestUrl: string, context: InvocationContext) {
        const t = await initI18n();
        const lngCode = (data.language as string) === SupportedLanguages.EN ? 'en' : 'cs';
        await t.changeLanguage(lngCode);

        // Zamezit registraci se stejným e-mailem
        const existing = await userRepository.findByEmail(data.email as string);
        if (existing) {
            const err = new Error("auth.registration.email_exists");
            err.name = "DuplicateEmailError";
            throw err;
        }

        const passwordHash = await hashPassword(data.password as string);

        const newUser: User = {
            id: crypto.randomUUID(),
            email: data.email as string,
            firstName: data.firstName as string,
            lastName: data.lastName as string,
            passwordHash,
            language: data.language as any,
            role: UserRole.CUSTOMER,
            isVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const createdUser = await userRepository.create(newUser);
        if (!createdUser) {
            throw new Error("auth.registration.error");
        }
        
        context.log(t.t("auth.registration.user_created", { email: createdUser.email }));

        // Odeslání ověřovacího e-mailu
        const verificationLink = `${requestUrl.replace('/auth/register', '/auth/registration/verify')}?userId=${createdUser.id}`;
        context.log(`Odesílám registrační e-mail uživateli ${createdUser.email} s odkazem: ${verificationLink}`);
        
        await sendEmail({
            to: createdUser.email,
            subject: t.t("auth.registration.verification_email_subject"),
            body: t.t("auth.registration.verification_email_body", { link: verificationLink })
        }, context);

        return {
            userId: createdUser.id,
            message: t.t("auth.registration.success")
        };
    }

    async verify(userId: string, context: InvocationContext) {
        const t = await initI18n();
        
        const user = await userRepository.findById(userId);

        if (!user) {
            return {
                status: 404,
                message: t.t("auth.registration.verification.not_found")
            };
        }

        if (user.language) {
            const lngCode = user.language === SupportedLanguages.CZ ? 'cs' : 'en';
            await t.changeLanguage(lngCode);
        }

        if (user.isVerified) {
            return {
                status: 200,
                message: t.t("auth.registration.verification.already_verified")
            };
        }

        const updatedUser: User = {
            ...user,
            isVerified: true,
            updatedAt: new Date().toISOString()
        };

        await userRepository.update(userId, updatedUser);
        context.log(t.t("auth.registration.verification.success") + ` (User: ${user.email})`);

        return {
            status: 200,
            message: t.t("auth.registration.verification.success")
        };
    }
}

export const registerService = new RegisterService();
