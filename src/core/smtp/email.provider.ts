import { InvocationContext } from "@azure/functions";
import { emailService } from "./email.service";

export interface EmailOptions {
    to: string;
    subject: string;
    body: string;
}

/**
 * Služba pro odesílání e-mailů. 
 * Nyní využívá nodemailer s konfigurací SMTP z prostředí.
 */
export async function sendEmail(options: EmailOptions, context: InvocationContext): Promise<void> {
    await emailService.sendEmail({
        to: options.to,
        subject: options.subject,
        html: options.body
    }, context);

    console.log(`Email sent to ${options.to}`);
}
