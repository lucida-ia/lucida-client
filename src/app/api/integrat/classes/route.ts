import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", message: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const token =
      process.env.LUCIDA_API_TOKEN || process.env.NEXT_PUBLIC_LUCIDA_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Missing API token env. Set LUCIDA_API_TOKEN (preferred) or NEXT_PUBLIC_LUCIDA_API_TOKEN.",
        },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const empresa = url.searchParams.get("empresa");

    if (!empresa) {
      return NextResponse.json(
        { status: "error", message: "Missing 'empresa' query param" },
        { status: 400 }
      );
    }

    const upstreamUrl = `https://lucida-api-v2-production.up.railway.app/v1/integrat/123/classes?empresa=${encodeURIComponent(
      empresa
    )}`;

    const upstreamRes = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        Authorization: token,
        "x-costumer": userId,
      },
    });
    const contentType = upstreamRes.headers.get("content-type") || "";
    const raw = await upstreamRes.text();

    let parsed: any = raw;
    if (contentType.includes("application/json")) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        // keep raw text
      }
    } else {
      // attempt parse anyway (API usually returns JSON)
      try {
        parsed = JSON.parse(raw);
      } catch {
        // keep raw text
      }
    }

    if (!upstreamRes.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: "Integrat upstream request failed",
          details: parsed,
        },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({
      status: "success",
      data: parsed,
    });
  } catch (error) {
    console.error("[INTEGRAT_CLASSES_PROXY_ERROR]", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch Integrat classes" },
      { status: 500 }
    );
  }
}

