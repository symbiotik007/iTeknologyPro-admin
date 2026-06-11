import { NextResponse } from "next/server";

// Identidad del deployment actual. Vercel inyecta estas variables solo;
// en local devuelve "dev" y el watcher no hace nada.
export const dynamic = "force-dynamic";

export async function GET() {
  const version =
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    "dev";

  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } },
  );
}
