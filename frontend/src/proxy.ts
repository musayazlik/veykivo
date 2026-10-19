import { NextResponse, type NextRequest } from "next/server";

/**
 * Yönetim paneli için hızlı ön kontrol: oturum cookie'si yoksa giriş sayfasına yönlendirir.
 * Asıl yetki kontrolü her istekte ASP.NET Core API'de yapılır; bu katman yalnızca kullanıcı deneyimi içindir.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/admin/giris")) return NextResponse.next();

  if (!request.cookies.has("veykivo.auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/giris";
    url.search = `?donus=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
