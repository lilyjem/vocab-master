/**
 * 邮件服务模块
 * 使用 QQ 邮箱 SMTP 发送系统邮件（密码重置、邮箱验证等）
 */
import nodemailer from "nodemailer";

// SMTP 配置从环境变量读取
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.qq.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // QQ 邮箱授权码
  },
});

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER;

/** 获取应用的基础 URL（用于构建邮件中的链接） */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** 发送密码重置邮件 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"VocabMaster" <${FROM}>`,
    to: email,
    subject: "重置您的密码 - VocabMaster",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
        <h2 style="color: #2563eb;">重置密码</h2>
        <p>您好，</p>
        <p>我们收到了重置您 VocabMaster 账户密码的请求。</p>
        <p>请点击下方按钮重置密码（链接有效期 1 小时）：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            重置密码
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">如果您没有请求重置密码，请忽略此邮件。</p>
        <p style="color: #666; font-size: 14px;">链接也可以复制到浏览器：${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">VocabMaster - 智能英语词汇学习</p>
      </div>
    `,
  });
}

/** 发送邮箱验证邮件 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"VocabMaster" <${FROM}>`,
    to: email,
    subject: "验证您的邮箱 - VocabMaster",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
        <h2 style="color: #2563eb;">验证邮箱</h2>
        <p>您好，</p>
        <p>感谢注册 VocabMaster！请点击下方按钮验证您的邮箱地址：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            验证邮箱
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">链接也可以复制到浏览器：${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">VocabMaster - 智能英语词汇学习</p>
      </div>
    `,
  });
}

/** 发送邮箱变更验证邮件 */
export async function sendEmailChangeVerification(newEmail: string, token: string): Promise<void> {
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}&type=change-email`;

  await transporter.sendMail({
    from: `"VocabMaster" <${FROM}>`,
    to: newEmail,
    subject: "确认新邮箱地址 - VocabMaster",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
        <h2 style="color: #2563eb;">确认新邮箱</h2>
        <p>您好，</p>
        <p>您正在将 VocabMaster 账户的邮箱更改为此地址。请点击下方按钮确认：</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            确认新邮箱
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">如果您没有请求更改邮箱，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">VocabMaster - 智能英语词汇学习</p>
      </div>
    `,
  });
}
