import { redirect } from 'next/navigation';

export default function WebmailConfigRedirectPage() {
  // Unificado: toda configuração agora vive em /webmail/admin
  redirect('/webmail/admin');
}