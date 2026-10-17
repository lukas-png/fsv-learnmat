import config from 'config';
import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | undefined;

// Created on first use and reused, so every mail shares one SMTP connection setup
const getTransporter = (): Transporter => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: "smtp.uni-hildesheim.de",
            port: 465,
            secure: true,
            auth: {
                user: config.get('uniUsername'),
                pass: config.get('uniPassword'),
            },
        });
    }
    return transporter;
};

class MailService {

    // Throws if the mail could not be sent, so callers can report the failure
    public async mail(to: string, subject: string, text: string): Promise<void> {
        await getTransporter().sendMail({
            from: `"Informatik Fachschaft 💻" <${config.get('uniMail')}>`,
            // bcc: 'fs_winf@uni-hildesheim.de',
            to,
            subject,
            text
        });
    }

}

export default MailService;
