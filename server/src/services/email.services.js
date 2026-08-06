import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #e74c3c; letter-spacing: 8px;">${otp}</h1>
        <p>This OTP will expire in <b>10 minutes</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.log("RESEND ERROR:", error);   // 👈 real wajah yahan print hogi
    throw new Error(error.message || "Failed to send email");
  }

  console.log("EMAIL SENT SUCCESSFULLY:", data);
  return data;
};