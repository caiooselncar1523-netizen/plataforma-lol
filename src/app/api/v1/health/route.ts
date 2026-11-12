import { prisma } from "@/server/db/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed: database is unavailable.", error);
    return Response.json(
      { status: "error", database: "unavailable" },
      { status: 503 },
    );
  }
}
