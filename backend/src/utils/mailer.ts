import nodemailer from "nodemailer";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

// === Valida variáveis de ambiente ===
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("As variáveis de ambiente SMTP não estão configuradas corretamente.");
}

// === Cria o transporter usando Resend SMTP ===
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true para 465 (SSL)
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// === Função base para envio ===
async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    console.log("🔹 Tentando enviar e-mail para:", to);
    console.log("🔹 SMTP_HOST:", SMTP_HOST);
    console.log("🔹 NODE_ENV:", process.env.NODE_ENV);

    try {
        await transporter.sendMail({
            from: `ItaAgro <${SMTP_USER}>`,
            to,
            subject,
            html: htmlContent,
        });

        console.log("✅ E-mail enviado com sucesso!");
    } catch (error: any) {
        console.error("❌ Erro ao enviar e-mail:", error.message || error);
        console.error("Stack:", error.stack);
        throw error;
    }
}

// === Funções específicas ===

// 1️⃣ Envio de código de verificação
export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Seu código de verificação ItaAgro</h2>
      <p>Use o seguinte código para ativar sua conta:</p>
      <div style="font-size: 32px; font-weight: bold; margin: 20px 0;">${code}</div>
      <p>Este código expira em 15 minutos.</p>
    </div>
  `;
    await sendEmail(to, "Código de Verificação - ItaAgro", htmlContent);
}

// 2️⃣ Envio de link de recuperação
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
      <p style="color: #666; font-size: 12px;">Se você não solicitou esta recuperação, ignore este e-mail.</p>
    </div>
  `;
    await sendEmail(to, "Recuperação de Senha - ItaAgro", htmlContent);
}

// 3️⃣ Envio de e-mail de verificação de conta
export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bem-vindo à ItaAgro!</h2>
      <p>Para ativar sua conta, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block;">Verificar E-mail</a>
      </div>
      <p>Se o botão não funcionar, copie e cole o link abaixo no navegador:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p>Este link expira em 24 horas.</p>
    </div>
  `;
    await sendEmail(to, "Verifique seu E-mail - ItaAgro", htmlContent);
}

// 4️⃣ Envio de código de redefinição de senha
export async function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Recuperação de Senha - ItaAgro</h2>
      <p>Use o código abaixo para redefinir sua senha. Ele é válido por 15 minutos.</p>
      <div style="font-size: 32px; font-weight: bold; margin: 20px 0;">${code}</div>
      <p>Se você não solicitou esta recuperação, pode ignorar este e-mail.</p>
    </div>
  `;
    await sendEmail(to, "Código para Redefinir Senha - ItaAgro", htmlContent);
}

// Exporta função base também
export { sendEmail };
