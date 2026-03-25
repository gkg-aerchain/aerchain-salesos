export default function middleware(request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(':');

      const validUser = process.env.AUTH_USER || 'admin';
      const validPass = process.env.AUTH_PASS;

      if (validPass && user === validUser && pass === validPass) {
        return undefined; // Allow request through
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Aerchain SalesOS"',
      'Content-Type': 'text/plain',
    },
  });
}

export const config = {
  matcher: ['/', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
