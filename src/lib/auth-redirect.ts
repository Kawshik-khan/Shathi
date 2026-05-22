import type { AuthUser } from '@/types';

function isSafeAppPath(path: string | null): path is string {
  return Boolean(path && path.startsWith('/') && !path.startsWith('//'));
}

export function getPostAuthRedirect(user: Pick<AuthUser, 'system_role'>, nextPath: string | null) {
  if (user.system_role === 'admin') {
    return isSafeAppPath(nextPath) && nextPath?.startsWith('/admin') ? nextPath : '/admin';
  }

  return isSafeAppPath(nextPath) ? nextPath : '/dashboard';
}
