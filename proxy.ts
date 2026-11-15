import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // cron uses its own bearer secret; static files and PWA assets must stay public
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|sw.js|icons/).*)"],
};
