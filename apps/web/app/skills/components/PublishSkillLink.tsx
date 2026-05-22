'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/app/components/LoginModal';

export function PublishSkillLink() {
  const { status } = useSession();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = React.useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (status === 'unauthenticated') {
      e.preventDefault();
      setLoginOpen(true);
    } else if (status === 'authenticated') {
      e.preventDefault();
      router.push('/submit');
    }
  };

  return (
    <>
      <a
        href="/submit"
        onClick={handleClick}
        className="text-blue-600 hover:underline"
      >
        publish your own skills
      </a>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        callbackUrl="/submit"
      />
    </>
  );
}
