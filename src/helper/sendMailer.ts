/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import nodemailer, {
  type Transporter,
  type SendMailOptions,
  type SentMessageInfo,
} from 'nodemailer';
import config from 'src/config/config';

const sendMailer = async (
  to: string,
  subject: string,
  html: string,
): Promise<SentMessageInfo> => {
  const transporter: Transporter<SentMessageInfo> = nodemailer.createTransport({
    host: config.email.host,
    port: 587,
    secure: false,
    auth: {
      user: config.email.address,
      pass: config.email.pass,
    },
  });

  const info: SentMessageInfo = await transporter.sendMail({
    from: `"${config.email.name as string}" <${config.email.address}>`,
    to,
    subject,
    html,
  } as SendMailOptions);

  console.log('Message sent:', info.messageId);
  return info;
};

export default sendMailer;
