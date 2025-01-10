import { CreateEmailOptions, Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (params: Omit<CreateEmailOptions, 'from'>) => {
    return resend.emails.send({
      from: process.env.RESEND_DOMAIN as string,
      to: params.to,
      subject: params.subject,
      html: params.html,
      react: params.react,
    });

};