import nodemailer from "nodemailer";
import { render, renderFile } from "ejs";
import { isObjectIdOrHexString } from "mongoose";
import path from "path";
import { EmailMQ, emailsMQ } from "./rabbitmq.js";
import { User } from "@/database/models/user.js";
import { sleep } from "@pride-spaces/common/utils/time.js";

export const transporter = nodemailer.createTransport({
  host: "mail.tg-iptv.site",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = async (options: nodemailer.SendMailOptions) => {
  try {
    if (!options || typeof options !== "object") {
      throw new Error("Invalid options");
    }
    if (!(options?.to || options?.cc || options?.bcc)) {
      throw new Error("Define receiver");
    }
    if (!((options?.text || options?.html) && options?.subject)) {
      throw new Error("Define email body and subject");
    }
    const info = await transporter.sendMail({
      ...options,
      from: options?.from || "Beeber 🐝 beeber@tg-iptv.site",
    });
    // console.log(info);
    if (info?.rejected.length) {
      throw new Error("Mail was rejected");
    }
    return true;
  } catch (err: any) {
    console.error("Error sending mail :", err.message);
    return false;
  }
};

const frontendBase = process.env.FRONTEND_BASE;

const handler = async (data: EmailMQ) => {
  try {
    let route = "/verify";
    if (data.type === "reset-password") {
      route = "/reset-password";
    }

    if (!isObjectIdOrHexString(data.user)) {
      throw new Error("Invalid user");
    }

    const hexToken = Buffer.from(data.token, "base64").toString("hex");
    if (!isObjectIdOrHexString(hexToken)) {
      throw new Error("Invalid token");
    }

    const user = await User.findOne(
      { _id: data.user },
      { email: 1, name: 1, username: 1 },
    );
    if (!user) {
      throw new Error("User not found");
    }
    const link = `${frontendBase}${route}?tk=${data.token}`;
    const template = await renderFile(
      path.join(
        import.meta.dirname,
        "../../../../views",
        data.type === "reset-password" ? "reset-password.ejs" : "email.ejs",
      ),
      { name: user.name || user.username, token: data.token, link: link },
    );
    const send = await sendMail({
      to: user.email || "",
      subject:
        data.type === "reset-password"
          ? "Password reset"
          : "Account Verification",
      html: template,
    });
    return send;
  } catch (err) {
    console.log("Mail data handler failed :", err);
    return false;
  }
};

export const handleMailQueue = async () => {
  await emailsMQ.channel?.prefetch?.(3);
  console.log("Mails Queue handler started");
  emailsMQ.consumeQueue(async (msg) => {
    if (msg) {
      const str = msg.content.toString();
      const data: EmailMQ = JSON.parse(str);
      console.log("Mails Queue consumed :", data);
      const handled = await handler(data);
      handled && emailsMQ.acknowledgement("yes", msg);
      await sleep(3);
    }
  });
};
