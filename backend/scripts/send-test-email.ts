// backend/scripts/send-test-email.ts
import { sendVerificationCodeEmail } from '../src/utils/mailer';

async function testEmail() {
  const email = process.argv[2]; // Pega o email da linha de comando
  if (!email) {
    console.error('Por favor, forneça um email como argumento.');
    process.exit(1);
  }

  console.log(`Enviando email de teste para: ${email}`);

  try {
    // Gera uma URL de verificação de exemplo
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=test-token-${Date.now()}`;
    await sendVerificationCodeEmail(email, verificationUrl);
    console.log('Script de teste de email concluído.');
  } catch (error) {
    console.error('Erro ao executar o script de teste de email:', error);
  }
}

testEmail();
