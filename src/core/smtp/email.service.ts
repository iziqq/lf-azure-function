import * as nodemailer from 'nodemailer';
import { InvocationContext } from "@azure/functions";

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export class EmailService {
    private getTransporter(): nodemailer.Transporter {
        const host = process.env.SMTP_SERVER;
        const port = parseInt(process.env.SMTP_PORT || '587');
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASSWORD;

        console.log(`SMTP configuration: host=${host}, port=${port}, user=${user}, pass=${pass}`);

        if (!host || !user || !pass) {
            console.warn("SMTP configuration is missing in environment variables. Email sending might fail.");
        }

        return nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
        });
    }

    async sendEmail(options: EmailOptions, context?: InvocationContext): Promise<void> {
        try {
            const transporter = this.getTransporter();
            const info = await transporter.sendMail({
                from: process.env.SMTP_USER,
                ...options,
            });

            if (context) {
                context.log(`Message sent: ${info.messageId}`);
            } else {
                console.log(`Message sent: ${info.messageId}`);
            }
        } catch (error) {
            if (context) {
                context.error(`Error sending email: ${error}`);
            } else {
                console.error(`Error sending email:`, error);
            }
            throw error;
        }
    }
}

export const emailService = new EmailService();
