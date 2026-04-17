import type { ReactNode } from 'react';
import DashboardTopNav from './DashboardTopNav';

interface Props {
  ragioneSociale: string;
  email: string;
  children: ReactNode;
}

export default function DashboardShell({ ragioneSociale, email, children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardTopNav ragioneSociale={ragioneSociale} email={email} />
      <main>{children}</main>
    </div>
  );
}
