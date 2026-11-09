import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname

  // Intercept any SVG connector requests caused by SVG <use> elements
  if (pathname.includes('connector-')) {
    return new Response(null, { status: 204 })
  }

  // Redirect /bul to /super-tournament/73
  if (pathname === '/bul') {
    return NextResponse.redirect(new URL('/super-tournament/73', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/bul', '/tournament/:path*']
} 