import { sendEmail } from "@/src/lib/email";
import prisma from "../db";

async function getDomainUrl(): Promise<string> {
  try {
    let appConfig = await prisma.appConfig.findFirst();
    if (!appConfig) {
      appConfig = await prisma.appConfig.create({
        data: {
          adminPass: "admin",
          rootDomain: "localhost:3000",
          enableHttps: false,
        },
      });
    }
    const protocol = appConfig.enableHttps ? "https" : "http";
    return `${protocol}://${appConfig.rootDomain}`;
  } catch (error) {
    return process.env.ROOT_DOMAIN || "http://localhost:3000";
  }
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName: string
) {
  const domainUrl = await getDomainUrl();
  const verificationUrl = `${domainUrl}/#verify?token=${token}`;
  const result = await sendEmail({
    to: email,
    from: process.env.VERIFICATION_EMAIL || "accounts@baby-control.com",
    subject: "Bem-vindo ao Baby Control - Verifique sua conta",
    text: `Olá ${firstName},\n\nBem-vindo ao Baby Control! Por favor, verifique seu endereço de e-mail acessando este link:\n\n${verificationUrl}\n\nEste link expirará em 24 horas.\n\nAtenciosamente,\nEquipe Baby Control`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Bem-vindo ao Baby Control!</h2>
        <p>Olá ${firstName},</p>
        <p>Bem-vindo ao Baby Control! Por favor, verifique seu endereço de e-mail clicando no botão abaixo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verificar endereço de e-mail
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Este link expirará em 24 horas. Se você não criou uma conta no Baby Control, ignore este e-mail.
        </p>
        <p>Atenciosamente,<br>Equipe Baby Control</p>
      </div>
    `,
  });
  return result;
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName: string
) {
  const domainUrl = await getDomainUrl();
  const resetUrl = `${domainUrl}/#passwordreset?token=${token}`;
  const result = await sendEmail({
    to: email,
    from: process.env.SECURITY_EMAIL || "passwordreset@baby-control.com",
    subject: "Baby Control - Solicitação de redefinição de senha",
    text: `Olá ${firstName},\n\nVocê solicitou a redefinição de senha para sua conta Baby Control. Acesse este link para redefinir sua senha:\n\n${resetUrl}\n\nEste link expirará em 15 minutos.\n\nSe você não solicitou a redefinição de senha, ignore este e-mail.\n\nAtenciosamente,\nEquipe Baby Control`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Solicitação de redefinição de senha</h2>
        <p>Olá ${firstName},</p>
        <p>Você solicitou a redefinição de senha para sua conta Baby Control. Clique no botão abaixo para redefinir sua senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Redefinir senha
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Este link expirará em 15 minutos. Se você não solicitou a redefinição de senha, ignore este e-mail.
        </p>
        <p>Atenciosamente,<br>Equipe Baby Control</p>
      </div>
    `,
  });
  return result;
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  familySlug: string,
  familyPin: string,
  caretakerLoginId: string
) {
  const domainUrl = await getDomainUrl();
  const familyUrl = `${domainUrl}/${familySlug}`;
  const result = await sendEmail({
    to: email,
    from: process.env.ACCOUNTS_EMAIL || "accounts@baby-control.com",
    subject: "Bem-vindo ao Baby Control - Sua família está pronta!",
    text: `Olá ${firstName},\n\nBem-vindo ao Baby Control! Sua conta foi verificada e sua família está pronta para uso.\n\nDetalhes da família:\n- URL da família: ${familyUrl}\n- Seu ID de login de cuidador: ${caretakerLoginId}\n- PIN da família: ${familyPin}\n\nUse seu ID de login de cuidador (${caretakerLoginId}) e PIN (${familyPin}) para acessar o painel da sua família diretamente.\n\nVocê pode compartilhar o URL da família, seu ID de login e PIN com outros cuidadores para que possam acessar os dados da família.\n\nComo proprietário da conta, você também pode fazer login diretamente usando seu e-mail e senha sem precisar do PIN.\n\nComece adicionando seu primeiro bebê e registrando suas primeiras atividades!\n\nAtenciosamente,\nEquipe Baby Control`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Bem-vindo ao Baby Control!</h2>
        <p>Olá ${firstName},</p>
        <p>Bem-vindo ao Baby Control! Sua conta foi verificada e sua família está pronta para uso.</p>
        <div style="background-color: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0d9488; margin-top: 0;">Detalhes da família:</h3>
          <p><strong>URL da família:</strong> <a href="${familyUrl}">${familyUrl}</a></p>
          <p><strong>Seu ID de login de cuidador:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${caretakerLoginId}</code></p>
          <p><strong>PIN da família:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px;">${familyPin}</code></p>
        </div>
        <p>Use seu ID de login de cuidador (<strong>${caretakerLoginId}</strong>) e PIN (<strong>${familyPin}</strong>) para acessar o painel da sua família diretamente.</p>
        <p>Você pode compartilhar o URL da família, seu ID de login e PIN com outros cuidadores para que possam acessar os dados da família.</p>
        <p>Como proprietário da conta, você também pode fazer login diretamente usando seu e-mail e senha sem precisar do PIN.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${familyUrl}" 
             style="background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Acessar painel da família
          </a>
        </div>
        <p>Comece adicionando seu primeiro bebê e registrando suas primeiras atividades!</p>
        <p>Atenciosamente,<br>Equipe Baby Control</p>
      </div>
    `,
  });
  return result;
}

export async function sendFeedbackConfirmationEmail(
  email: string,
  firstName: string,
  subject: string
) {
  const domainUrl = await getDomainUrl();
  const result = await sendEmail({
    to: email,
    from: process.env.ACCOUNTS_EMAIL || "feedback@baby-control.com",
    subject: "Baby Control - Feedback recebido",
    text: `Olá ${firstName},\n\nObrigado pelo seu feedback! Recebemos sua mensagem sobre "${subject}" e agradecemos por nos ajudar a melhorar o Baby Control.\n\nNossa equipe irá analisar seu feedback e pode entrar em contato se precisar de mais informações.\n\nSua opinião nos ajuda a tornar o Baby Control melhor para todas as famílias.\n\nAtenciosamente,\nEquipe Baby Control`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Obrigado pelo seu feedback!</h2>
        <p>Olá ${firstName},</p>
        <p>Obrigado pelo seu feedback! Recebemos sua mensagem sobre <strong>"${subject}"</strong> e agradecemos por nos ajudar a melhorar o Baby Control.</p>
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <p style="margin: 0; color: #059669; font-weight: 600;">
            Seu feedback é importante para nós e ajuda a tornar o Baby Control melhor para todas as famílias.
          </p>
        </div>
        <p>Nossa equipe irá analisar seu feedback e pode entrar em contato se precisar de mais informações.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${domainUrl}" 
             style="background-color: #059669; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Continuar usando o Baby Control
          </a>
        </div>
        <p>Atenciosamente,<br>Equipe Baby Control</p>
      </div>
    `,
  });
  return result;
}

export async function sendAccountClosureEmail(
  email: string,
  firstName: string
) {
  const domainUrl = await getDomainUrl();
  const result = await sendEmail({
    to: email,
    from: process.env.ACCOUNTS_EMAIL || "accounts@baby-control.com",
    subject: "Baby Control - Conta encerrada",
    text: `Olá ${firstName},\n\nSua conta Baby Control foi encerrada conforme solicitado.\n\nSua conta e os dados da família foram desativados e não estão mais acessíveis. Esta ação não pode ser desfeita.\n\nSe você encerrou sua conta por engano ou deseja reativá-la, entre em contato com nossa equipe de suporte o quanto antes.\n\nObrigado por usar o Baby Control. Sentimos muito em vê-lo partir!\n\nAtenciosamente,\nEquipe Baby Control`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Conta encerrada</h2>
        <p>Olá ${firstName},</p>
        <p>Sua conta Baby Control foi encerrada conforme solicitado.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #dc2626; font-weight: 600;">
            Sua conta e os dados da família foram desativados e não estão mais acessíveis. Esta ação não pode ser desfeita.
          </p>
        </div>
        <p>Se você encerrou sua conta por engano ou deseja reativá-la, entre em contato com nossa equipe de suporte o quanto antes.</p>
        <p>Obrigado por usar o Baby Control. Sentimos muito em vê-lo partir!</p>
        <p>Atenciosamente,<br>Equipe Baby Control</p>
      </div>
    `,
  });
  return result;
}
