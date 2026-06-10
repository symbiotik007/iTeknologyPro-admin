import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si faltan las env vars, no tumbar el sitio con un 500: dejar pasar y avisar en logs.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[middleware] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno"
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("[middleware] auth.getUser falló:", err);
  }

  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin     = pathname === "/login";
  const isApi       = pathname.startsWith("/api");

  // API routes: CORS para la tienda frontend
  if (isApi) {
    supabaseResponse.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_STORE_URL || "*");
    supabaseResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    supabaseResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return supabaseResponse;
  }

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
