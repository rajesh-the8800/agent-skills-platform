import NextAuth from 'next-auth';
import type { Account, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Google from 'next-auth/providers/google';

/**
 * Auth.js requires a non-empty secret or every /api/auth/* call returns 500
 * ("There was a problem with the server configuration").
 */
function resolveAuthSecret(): string {
  const fromEnv = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[auth] AUTH_SECRET is not set. Using an insecure development default. Add AUTH_SECRET to apps/web/.env.local (see repo .env.example).',
    );
    return 'dev-only-insecure-auth-secret-do-not-use-in-production';
  }
  throw new Error(
    'AUTH_SECRET (or NEXTAUTH_SECRET) must be set in production. Generate one with: openssl rand -base64 32',
  );
}

async function syncUserToApi(payload: {
  email: string;
  name?: string | null;
  avatar?: string | null;
  providerAccountId?: string | null;
}) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET is not set — cannot sync user to API');
  }

  const res = await fetch(`${apiUrl}/auth/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar,
      provider: 'google',
      providerAccountId: payload.providerAccountId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('auth/sync failed', res.status, text);
    return null;
  }

  return (await res.json()) as { id: string; role: string };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({
      token,
      account,
      profile,
    }: {
      token: JWT;
      account?: Account | null;
      profile?: unknown;
    }) {
      const p =
        profile &&
        typeof profile === 'object' &&
        'email' in profile &&
        typeof (profile as { email?: unknown }).email === 'string'
          ? (profile as { name?: string; picture?: string; email: string })
          : null;
      if (account?.provider === 'google' && p?.email) {
        const synced = await syncUserToApi({
          email: p.email,
          name: p.name,
          avatar: p.picture,
          providerAccountId: account.providerAccountId,
        });
        if (!synced?.id) {
          throw new Error('Could not create or update your account. Is the API running?');
        }
        token.dbUserId = synced.id;
        token.dbUserRole = synced.role;
        if (p.picture) {
          token.picture = p.picture;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = (token.dbUserId as string) ?? '';
        session.user.role = (token.dbUserRole as string) ?? 'USER';
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
  },
});
