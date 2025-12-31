import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  // Skip authentication in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Get the authorization header
  const authorization = request.headers.get('authorization')

  // Check if user is already authenticated (has valid credentials)
  if (authorization) {
    const credentials = authorization.split(' ')[1]
    const [username, password] = Buffer.from(credentials, 'base64').toString().split(':')

    const validUsername = process.env.BASIC_AUTH_USERNAME || 'admin'
    const validPassword = process.env.BASIC_AUTH_PASSWORD || 'password'

    if (username === validUsername && password === validPassword) {
      return NextResponse.next()
    }
  }

  // Return 401 Unauthorized with WWW-Authenticate header
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
