import { serverEnv } from "@/config/env";
import { db } from "@/db";
import { quoteRequestNotifications } from "@/db/schema";
import { eq } from "drizzle-orm";

type QuoteRequest = { id: string; referenceNumber: string; customerName: string; customerEmail: string; customerPhone: string; message: string | null };

function encodeHeader(value: string) {
  return value.replace(/[\r\n]/g, " ");
}

export async function sendQuoteNotification(request: QuoteRequest) {
  const notification = {
    to: serverEnv.EMAIL_TO,
    from: serverEnv.EMAIL_FROM,
    smtpHost: serverEnv.SMTP_HOST,
    smtpPort: serverEnv.SMTP_PORT,
    smtpUser: serverEnv.SMTP_USER,
    smtpPassword: serverEnv.SMTP_PASSWORD,
  };

  if (!notification.to || !notification.from || !notification.smtpHost || !notification.smtpPort) {
    await db.update(quoteRequestNotifications).set({ status: "FAILED", payloadJson: JSON.stringify({ error: "Email delivery is not configured." }) }).where(eq(quoteRequestNotifications.quoteRequestId, request.id));
    return false;
  }

  const payload = [
    `From: ${encodeHeader(notification.from)}`,
    `To: ${encodeHeader(notification.to)}`,
    `Subject: New quote request ${encodeHeader(request.referenceNumber)}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    `Reference: ${request.referenceNumber}`,
    `Name: ${request.customerName}`,
    `Email: ${request.customerEmail}`,
    `Phone: ${request.customerPhone}`,
    `Message: ${request.message ?? "-"}`,
  ].join("\r\n");

  try {
    await deliverSmtp(notification.smtpHost, notification.smtpPort, notification.smtpUser, notification.smtpPassword, notification.from, notification.to, payload);
    await db.update(quoteRequestNotifications).set({ status: "SENT", sentAt: new Date(), payloadJson: JSON.stringify({ to: notification.to }) }).where(eq(quoteRequestNotifications.quoteRequestId, request.id));
    return true;
  } catch (error) {
    await db.update(quoteRequestNotifications).set({ status: "FAILED", payloadJson: JSON.stringify({ error: error instanceof Error ? error.message : "Email delivery failed." }) }).where(eq(quoteRequestNotifications.quoteRequestId, request.id));
    return false;
  }
}

async function deliverSmtp(host: string, port: number, user: string | undefined, password: string | undefined, from: string, to: string, message: string) {
  const tls = await import("node:tls");
  await new Promise<void>((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: true });
    let buffer = "";
    let step = 0;
    const commands = [
      `EHLO localhost\r\n`,
      ...(user && password ? [`AUTH LOGIN\r\n`, `${Buffer.from(user).toString("base64")}\r\n`, `${Buffer.from(password).toString("base64")}\r\n`] : []),
      `MAIL FROM:<${from}>\r\n`,
      `RCPT TO:<${to}>\r\n`,
      "DATA\r\n",
      `${message.replace(/\r?\n/g, "\r\n")}\r\n.\r\n`,
      "QUIT\r\n",
    ];
    const fail = (error: Error) => { socket.destroy(); reject(error); };
    socket.setTimeout(15000, () => fail(new Error("SMTP connection timed out.")));
    socket.on("error", fail);
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      if (!buffer.includes("\r\n")) return;
      const lines = buffer.split("\r\n");
      buffer = lines.pop() ?? "";
      const response = lines.at(-1) ?? "";
      const code = Number(response.slice(0, 3));
      if (code >= 400) return fail(new Error(`SMTP rejected command: ${response}`));
      if (step >= commands.length) return;
      socket.write(commands[step++]);
      if (step === commands.length) socket.end();
    });
    socket.on("close", () => resolve());
  });
}