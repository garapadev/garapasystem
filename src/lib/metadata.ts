import { Metadata } from 'next';

// Tipo para configurações do sistema
type SystemConfig = {
  sistemaNome?: string;
  projetoTitulo?: string;
};

// Função para buscar configurações do sistema diretamente do banco
export async function getSystemConfig(): Promise<SystemConfig | null> {
  try {
    // Usar a instância singleton do Prisma Client
    const { db } = await import('./db');
    
    const configuracoes = await db.configuracao.findMany({
      where: {
        chave: {
          in: ['sistema_nome', 'projeto_titulo']
        }
      }
    });
    
    // Converter array de configurações em objeto
    const config: SystemConfig = {};
    configuracoes.forEach((item) => {
      if (item.chave === 'sistema_nome') {
        config.sistemaNome = item.valor;
      } else if (item.chave === 'projeto_titulo') {
        config.projetoTitulo = item.valor;
      }
    });
    
    return config;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }
}

// Função para gerar metadata dinâmico
export async function generateDynamicMetadata(pageTitle?: string): Promise<Metadata> {
  const config = await getSystemConfig();
  
  const systemName = config?.sistemaNome || 'GarapaSystem';
  const projectTitle = config?.projetoTitulo ? `${config.projetoTitulo} - GarapaSystem` : 'Sistema de Gestão - GarapaSystem';
  
  const title = pageTitle ? `${pageTitle} - ${systemName}` : `${projectTitle}`;
  
  return {
    title,
    description: `${systemName} - Sistema de gestão moderno e eficiente`,
    keywords: [systemName, projectTitle, "gestão", "CRM", "ERP", "sistema"],
    authors: [{ name: "GarapaSystem Team" }],
    openGraph: {
      title: systemName,
      description: `${projectTitle} - Sistema de gestão completo`,
      siteName: systemName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: systemName,
      description: `${projectTitle} - Sistema de gestão completo`,
    },
  };
}

// Metadata padrão para fallback
export const defaultMetadata: Metadata = {
  title: "GarapaSystem - Sistema de Gestão",
  description: "Sistema de gestão moderno e eficiente",
  keywords: ["GarapaSystem", "gestão", "CRM", "ERP", "sistema"],
  authors: [{ name: "GarapaSystem Team" }],
  openGraph: {
    title: "GarapaSystem",
    description: "Sistema de gestão completo",
    siteName: "GarapaSystem",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GarapaSystem",
    description: "Sistema de gestão completo",
  },
};