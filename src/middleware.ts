import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Lewati API, aset internal Next, dan file statis (yang mengandung ".").
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
