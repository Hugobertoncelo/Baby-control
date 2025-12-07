import nodemailer from "nodemailer";
import { SmtpEmailProps } from "./types";

export const sendWithSmtp = async (props: SmtpEmailProps) => {
  const { host, port, secure, auth, tls, to, from, subject, text, html } =
    props;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    tls,
  });

  const mailOptions = {
    to,
    from,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
