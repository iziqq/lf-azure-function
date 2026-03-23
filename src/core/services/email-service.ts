import { InvocationContext } from "@azure/functions";

export interface EmailOptions {
    to: string;
    subject: string;
    body: string;
}

/**
 * Služba pro odesílání e-mailů. 
 * Aktuálně jen simuluje odesílání pomocí logování do Azure Functions kontextu.
 */
export async function sendEmail(options: EmailOptions, context: InvocationContext): Promise<void> {
    context.log(`[EmailService] Odesílám e-mail pro: ${options.to}`);
    context.log(`[EmailService] Předmět: ${options.subject}`);
    context.log(`[EmailService] Obsah: ${options.body}`);
    
    // Zde by v budoucnu proběhla integrace např. se SendGrid nebo Azure Communication Services
    return Promise.resolve();
}
