import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

type ContactPayload = {
  name: string;
  email: string;
  whatsapp: string;
  subject: string;
  message: string;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function createTransporter() {
  const host = getEnv("MAIL_HOST");
  const port = Number(getEnv("MAIL_PORT"));
  const secure = getEnv("MAIL_SECURE") === "true";
  const user = getEnv("MAIL_USER");
  const pass = getEnv("MAIL_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure, // true para 465, false para 587
    auth: { user, pass },
  });
}

function validatePayload(body: Partial<ContactPayload>) {
  const required: (keyof ContactPayload)[] = [
    "name",
    "email",
    "whatsapp",
    "subject",
    "message",
  ];

  const missing = required.filter(
    (k) => !body[k] || String(body[k]).trim() === "",
  );
  return missing;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ContactPayload>;
    const missing = validatePayload(body);

    if (missing.length) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios", missing },
        { status: 400 },
      );
    }

    const { name, email, whatsapp, subject, message } = body as ContactPayload;

    const mailTo = process.env.MAIL_TO || process.env.MAIL_USER;
    if (!mailTo) throw new Error("Missing env var: MAIL_TO (or MAIL_USER)");

    const fromName = process.env.MAIL_FROM_NAME || "Lucida";
    const mailUser = getEnv("MAIL_USER");

    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      whatsapp: escapeHtml(whatsapp),
      subject: escapeHtml(subject),
      message: escapeHtml(message),
    };

    const text = [
      "Nova mensagem de contato do site Lucida:",
      "",
      `Nome: ${name}`,
      `Email: ${email}`,
      `WhatsApp: ${whatsapp}`,
      `Assunto: ${subject}`,
      "",
      "Mensagem:",
      message,
      "",
      "---",
      "Esta mensagem foi enviada através do formulário de contato do site Lucida.",
    ].join("\n");

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Nova mensagem de contato do site Lucida</h2>
        <p><strong>Nome:</strong> ${safe.name}</p>
        <p><strong>Email:</strong> ${safe.email}</p>
        <p><strong>WhatsApp:</strong> ${safe.whatsapp}</p>
        <p><strong>Assunto:</strong> ${safe.subject}</p>
        <hr />
        <p><strong>Mensagem:</strong></p>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${safe.message}</pre>
        <hr />
        <p style="color:#666; font-size: 12px;">
          Esta mensagem foi enviada através do formulário de contato do site Lucida.
        </p>
      </div>
    `.trim();

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"${name} via Lucida" <${mailUser}>`, // mailUser = seu email do domínio
      to: mailTo,
      subject: `[Lucida] ${subject}`,
      text,
      html,
      replyTo: email, // quando você clicar "Responder", vai pro usuário
      sender: mailUser, // opcional, mas ajuda
    });

    return NextResponse.json({ message: "Mensagem enviada com sucesso!" });
  } catch (err) {
    console.error("Error sending email:", err);

    const message =
      err instanceof Error && err.message.includes("Missing env var")
        ? "Configuração de email não encontrada. Contate o administrador."
        : "Erro ao enviar mensagem. Tente novamente.";

    return NextResponse.json(
      {
        error: message,
        details:
          process.env.NODE_ENV === "development"
            ? err instanceof Error
              ? err.message
              : String(err)
            : undefined,
      },
      { status: 500 },
    );
  }
}
