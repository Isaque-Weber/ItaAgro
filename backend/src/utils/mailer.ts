import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const { GMAIL_SENDER_EMAIL, GMAIL_APP_PASSWORD } = process.env;

if (!GMAIL_SENDER_EMAIL || !GMAIL_APP_PASSWORD) {
  throw new Error('As variáveis de ambiente do Gmail não estão configuradas.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_SENDER_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  await transporter.sendMail({
    from: `ItaAgro <${GMAIL_SENDER_EMAIL}>`,
    to,
    subject,
    html: htmlContent,
  });
}

// Mantém suas funções de envio de e-mail (sem alteração)
export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Seu código de verificação ItaAgro</h2>
      <p>Use o seguinte código para ativar sua conta:</p>
      <div style="font-size: 32px; font-weight: bold; margin: 20px 0;">${code}</div>
      <p>Este código expira em 15 minutos.</p>
    </div>
  `;
  await sendEmail(to, 'Código de Verificação - ItaAgro', htmlContent);
}

export async function sendRecoveryEmail(to: string, resetUrl: string): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Recuperação de Senha - ItaAgro</h2>
      <p>Você solicitou a recuperação de senha.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Redefinir Senha</a>
      </div>
      <p>Se o botão não funcionar, copie e cole o link abaixo no navegador:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p>Este link expira em 24 horas.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">Se você não solicitou esta recuperação, ignore este email.</p>
    </div>
  `;
  await sendEmail(to, 'Recuperação de senha - ItaAgro', htmlContent);
}

export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bem-vindo à ItaAgro!</h2>
      <p>Para ativar sua conta, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Verificar Email</a>
      </div>
      <p>Se o botão não funcionar, copie e cole o link abaixo no navegador:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p>Este link expira em 24 horas.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">Se você não solicitou esta verificação, ignore este email.</p>
    </div>
  `;
  await sendEmail(to, 'Verifique seu email - ItaAgro', htmlContent);
}

export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Recuperação de Senha - ItaAgro</h2>
      <p>Use o código abaixo para redefinir sua senha. Ele é válido por 15 minutos.</p>
      <div style="font-size: 32px; font-weight: bold; margin: 20px 0;">${code}</div>
      <p>Se você não solicitou esta recuperação, pode ignorar este e-mail.</p>
    </div>
  `;
  await sendEmail(to, 'Código para Redefinir Senha - ItaAgro', htmlContent);
}

export { sendEmail };
