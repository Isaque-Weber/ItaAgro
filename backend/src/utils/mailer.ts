// backend/src/utils/mailer.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
})

/**
 * Envia o e-mail de recuperação de senha.
 */
export async function sendRecoveryEmail(to: string, resetUrl: string): Promise<void> {
    await transporter.sendMail({
        from: `"ItaAgro" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Recuperação de senha',
        html: `
      <p>Você solicitou recuperação de senha.</p>
      <p>Clique <a href="${resetUrl}">aqui</a> para redefinir sua senha.</p>
    `
    })
}
