// backend/src/utils/mailer.ts
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

const createTransport = async (): Promise<nodemailer.Transporter<SMTPTransport.SentMessageInfo>> => {
  console.log('[MAILER] createTransport: Iniciando criação do transportador.');
  const GMAIL_SENDER_EMAIL = process.env.GMAIL_SENDER_EMAIL;
  const GMAIL_OAUTH_CLIENT_ID = process.env.GMAIL_OAUTH_CLIENT_ID;
  const GMAIL_OAUTH_CLIENT_SECRET = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const GMAIL_OAUTH_REFRESH_TOKEN = process.env.GMAIL_OAUTH_REFRESH_TOKEN;

  // Verifica se as credenciais OAuth2 estão configuradas
  const useOAuth2 = GMAIL_SENDER_EMAIL && GMAIL_OAUTH_CLIENT_ID && GMAIL_OAUTH_CLIENT_SECRET && GMAIL_OAUTH_REFRESH_TOKEN;

  if (!useOAuth2) {
    console.error('[MAILER] createTransport: Variáveis de ambiente do Gmail OAuth2 não configuradas.');
    throw new Error('As variáveis de ambiente do Gmail OAuth2 não estão configuradas.');
  }

  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    GMAIL_OAUTH_CLIENT_ID,
    GMAIL_OAUTH_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // URL de redirecionamento
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_OAUTH_REFRESH_TOKEN,
  });

  const accessToken = await oauth2Client.getAccessToken();
  console.log('[MAILER] createTransport: Access Token obtido.');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GMAIL_SENDER_EMAIL,
      clientId: GMAIL_OAUTH_CLIENT_ID,
      clientSecret: GMAIL_OAUTH_CLIENT_SECRET,
      refreshToken: GMAIL_OAUTH_REFRESH_TOKEN,
      accessToken: accessToken.token || '',
    },
  });
};

/**
 * Envia um email genérico.
 */
async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  console.log(`[MAILER] sendEmail: Tentando enviar email para: ${to}, Assunto: ${subject}`);
  const GMAIL_SENDER_EMAIL = process.env.GMAIL_SENDER_EMAIL;
  const GMAIL_OAUTH_CLIENT_ID = process.env.GMAIL_OAUTH_CLIENT_ID;
  const GMAIL_OAUTH_CLIENT_SECRET = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  const GMAIL_OAUTH_REFRESH_TOKEN = process.env.GMAIL_OAUTH_REFRESH_TOKEN;
  const useOAuth2 = GMAIL_SENDER_EMAIL && GMAIL_OAUTH_CLIENT_ID && GMAIL_OAUTH_CLIENT_SECRET && GMAIL_OAUTH_REFRESH_TOKEN;

  try {
    const transporter = await createTransport();
    const mailOptions = {
      from: `ItaAgro <${GMAIL_SENDER_EMAIL || 'noreply@itaagro.com'}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };
    console.log('[MAILER] sendEmail: Opções de email preparadas:', mailOptions);

    const info = await transporter.sendMail(mailOptions);

    if (useOAuth2) {
      console.log('[MAILER] Email enviado com sucesso:', info.response);
    } else {
      // @ts-ignore - a propriedade 'buffer' existe no streamTransport
      console.log('--- INÍCIO DO EMAIL ---');
      // @ts-ignore
      console.log(info.message.toString());
      console.log('--- FIM DO EMAIL ---');
    }
  } catch (error) {
    console.error('[MAILER] Erro ao enviar email:', error);
    throw new Error('Falha ao enviar o email.');
  }
}

/**
 * Envia o e-mail de recuperação de senha.
 */
export async function sendRecoveryEmail(to: string, resetUrl: string): Promise<void> {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperação de Senha - ItaAgro</h2>
            <p>Você solicitou a recuperação de senha.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                    Redefinir Senha
                </a>
            </div>
            <p>Se o botão não funcionar, você pode copiar e colar o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">
                ${resetUrl}
            </p>
            <p>Este link expira em 24 horas.</p>
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Se você não solicitou esta recuperação de senha, pode ignorar este email.
            </p>
        </div>
    `
    await sendEmail(to, 'Recuperação de senha - ItaAgro', htmlContent)
}

/**
 * Envia o e-mail de verificação.
 */
export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bem-vindo à ItaAgro!</h2>
            <p>Obrigado por se cadastrar. Para ativar sua conta, por favor clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                    Verificar Email
                </a>
            </div>
            
            <p>Se o botão não funcionar, você pode copiar e colar o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">
                ${verificationUrl}
            </p>
            
            <p>Este link expira em 24 horas.</p>
            
            <hr style="border: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
                Se você não solicitou esta verificação, pode ignorar este email.
            </p>
        </div>
    `
    await sendEmail(to, 'Verifique seu email - ItaAgro', htmlContent)
}