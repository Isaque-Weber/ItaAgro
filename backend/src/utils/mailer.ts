// src/utils/mailer.ts
import { Resend } from 'resend';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const { RESEND_API_KEY, SMTP_FROM, ALERT_EMAIL } = process.env;

if (!RESEND_API_KEY) {
    throw new Error('A variável RESEND_API_KEY não está configurada.');
}

export const resend = new Resend(RESEND_API_KEY);

async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    console.log('📤 Enviando e-mail via Resend...');
    console.log('🔹 Para:', to);
    console.log('🔹 Assunto:', subject);

    try {
        const result = await resend.emails.send({
            from: SMTP_FROM || 'ItaAgro <noreply@itaagroia.com.br>',
            to,
            subject,
            html,
            text,
        });

        if (result.error) {
            console.error('❌ Falha no envio:', result.error);
        } else {
            console.log('✅ E-mail enviado com sucesso! ID:', result.data?.id);
        }
    } catch (err: any) {
        console.error('❌ Erro ao enviar e-mail:', err.message || err);
        console.error(err.stack);
        throw err;
    }
}

// 1️⃣ Código de verificação
export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Seu código de verificação ItaAgro</h2>
    <p>Use o seguinte código para ativar sua conta:</p>
    <div style="font-size: 32px; font-weight: bold; margin: 20px 0;">${code}</div>
    <p>Este código expira em 15 minutos.</p>
  </div>`;
    await sendEmail(to, 'Código de Verificação - ItaAgro', html);
}

// 2️⃣ Link de recuperação de senha
export async function sendRecoveryEmail(to: string, resetUrl: string): Promise<void> {
    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Recuperação de Senha - ItaAgro</h2>
    <p>Você solicitou a recuperação de senha.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px;">Redefinir Senha</a>
    </div>
    <p>Se o botão não funcionar, copie e cole o link abaixo no navegador:</p>
    <p style="word-break: break-all; color: #666;">${resetUrl}</p>
    <p>Este link expira em 24 horas.</p>
  </div>`;
    await sendEmail(to, 'Recuperação de Senha - ItaAgro', html);
}

// 3️⃣ Verificação de conta
export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Bem-vindo à ItaAgro!</h2>
    <p>Para ativar sua conta, clique no botão abaixo:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px;">Verificar E-mail</a>
    </div>
    <p>Se o botão não funcionar, copie e cole o link abaixo no navegador:</p>
    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
  </div>`;
    await sendEmail(to, 'Verifique seu E-mail - ItaAgro', html);
}

// 4️⃣ Código para redefinição de senha
export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Recuperação de Senha - ItaAgro</h2>
    <p>Use o código abaixo para redefinir sua senha (válido por 15 minutos):</p>
    <div style="font-size: 32px; font-weight: bold; margin: 20px 0;">${code}</div>
    <p>Se você não solicitou, ignore este e-mail.</p>
  </div>`;
    await sendEmail(to, 'Código para Redefinir Senha - ItaAgro', html);
}

// 5️⃣ Alerta genérico (ex: Agrofit)
export async function sendAlertEmail(message: string, details?: string): Promise<void> {
    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>🚨 Alerta do Sistema ItaAgro</h2>
    <p>${message}</p>
    ${details ? `<pre style="background:#f8f8f8;padding:10px;border-radius:6px;">${details}</pre>` : ''}
  </div>`;
    const to = ALERT_EMAIL || SMTP_FROM!;
    await sendEmail(to, '🚨 Alerta do Sistema - ItaAgro', html, message);
}

export { sendEmail };
