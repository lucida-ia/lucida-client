import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { name, email, whatsapp, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message || !whatsapp || !subject) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Debug environment variables
    console.log("Environment check:");
    console.log("GMAIL_USER:", process.env.GMAIL_USER ? "✓ Set" : "✗ Missing");
    console.log(
      "GMAIL_APP_PASSWORD:",
      process.env.GMAIL_APP_PASSWORD ? "✓ Set" : "✗ Missing"
    );

    // Check if environment variables are set
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        {
          error:
            "Configuração de email não encontrada. Contate o administrador.",
        },
        { status: 500 }
      );
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // lucida.contato@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD, // App password from Gmail
      },
    });

    // Email content
    const emailContent = `
Nova mensagem de contato do site Lucida:

Nome: ${name}
Email: ${email}
WhatsApp: ${whatsapp}
Assunto: ${subject}

Mensagem:
${message}

---
Esta mensagem foi enviada através do formulário de contato do site Lucida.
    `.trim();

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to same email
      subject: `[Lucida] ${subject}`,
      text: emailContent,
      replyTo: email, // Allow replying directly to the user
    });

    return NextResponse.json(
      { message: "Mensagem enviada com sucesso!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);

    // More detailed error for debugging
    let errorMessage = "Erro ao enviar mensagem. Tente novamente.";

    if (error instanceof Error) {
      console.error("Error details:", error.message);
      // Include more specific error info for debugging
      if (error.message.includes("auth")) {
        errorMessage =
          "Erro de autenticação do email. Verifique as configurações.";
      } else if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("network")
      ) {
        errorMessage = "Erro de conexão. Verifique sua internet.";
      } else if (error.message.includes("Invalid login")) {
        errorMessage = "Login inválido. Verifique email e senha do Gmail.";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
