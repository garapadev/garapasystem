'use client';

import { useEffect, useState } from 'react';

interface ApiSpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export default function SwaggerPage() {
  const [spec, setSpec] = useState<ApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/docs')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(apiSpec => {
        setSpec(apiSpec);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar especificação OpenAPI:', err);
        setError(err.message || 'Erro ao carregar documentação');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando documentação da API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhuma especificação encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {spec.info.title}
          </h1>
          <p className="text-gray-600 mb-4">{spec.info.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Versão: {spec.info.version}</span>
            <span>OpenAPI: {spec.openapi}</span>
          </div>
        </div>

        {/* Servers */}
        {spec.servers && spec.servers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Servidores</h2>
            {spec.servers.map((server, index) => (
              <div key={index} className="mb-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{server.url}</code>
                {server.description && (
                  <span className="ml-2 text-gray-600">{server.description}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Authentication */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Autenticação</h2>
          <div className="space-y-2 text-blue-800">
            <p>
              <strong>Header:</strong> <code className="bg-blue-100 px-2 py-1 rounded">X-API-Key</code>
            </p>
            <p>
              <strong>Tipo:</strong> API Key
            </p>
            <p className="text-sm text-blue-700">
              Inclua sua chave de API no header X-API-Key em todas as requisições.
            </p>
          </div>
        </div>

        {/* Endpoints */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Endpoints</h2>
          <div className="space-y-4">
            {Object.entries(spec.paths).map(([path, methods]) => (
              <div key={path} className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{path}</h3>
                {Object.entries(methods as Record<string, any>).map(([method, details]) => (
                  <div key={method} className="mb-3 p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                        method === 'get' ? 'bg-green-100 text-green-800' :
                        method === 'post' ? 'bg-blue-100 text-blue-800' :
                        method === 'put' ? 'bg-yellow-100 text-yellow-800' :
                        method === 'delete' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {method}
                      </span>
                      <span className="text-gray-700 font-medium">{details.summary || 'Sem descrição'}</span>
                    </div>
                    {details.description && (
                      <p className="text-gray-600 text-sm mb-2">{details.description}</p>
                    )}
                    {details.tags && (
                      <div className="flex flex-wrap gap-1">
                        {details.tags.map((tag: string, tagIndex: number) => (
                          <span key={tagIndex} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Documentação gerada automaticamente a partir da especificação OpenAPI</p>
        </div>
      </div>
    </div>
  );
}