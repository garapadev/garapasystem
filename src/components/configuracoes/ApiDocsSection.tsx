'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Copy, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, any>;
}

interface ApiDocumentation {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, ApiEndpoint>>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

export function ApiDocsSection() {
  const [documentation, setDocumentation] = useState<ApiDocumentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentation();
  }, []);

  const fetchDocumentation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/docs');
      if (response.ok) {
        const docs = await response.json();
        setDocumentation(docs);
      }
    } catch (error) {
      console.error('Erro ao carregar documentação:', error);
      toast.error('Erro ao carregar documentação da API');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const downloadDocumentation = () => {
    if (!documentation) return;
    
    const blob = new Blob([JSON.stringify(documentation, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-documentation.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Documentação baixada com sucesso!');
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-100 text-green-800 border-green-200',
      POST: 'bg-blue-100 text-blue-800 border-blue-200',
      PUT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      DELETE: 'bg-red-100 text-red-800 border-red-200',
      PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[method.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Carregando documentação...</div>;
  }

  if (!documentation) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Erro ao carregar documentação da API</p>
        <Button onClick={fetchDocumentation} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const endpoints = Object.entries(documentation.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, endpoint]) => ({
      ...endpoint,
      path,
      method: method.toUpperCase(),
      id: `${method.toUpperCase()}-${path}`,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">{documentation.info.title}</h3>
          <p className="text-sm text-muted-foreground">
            Versão {documentation.info.version} • {endpoints.length} endpoints
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {documentation.info.description}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadDocumentation}>
            <Download className="mr-2 h-4 w-4" />
            Baixar JSON
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Swagger UI
            </a>
          </Button>
        </div>
      </div>

      {/* Servers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Servidores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documentation.servers.map((server, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <code className="text-sm font-mono">{server.url}</code>
                  <p className="text-xs text-muted-foreground mt-1">{server.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(server.url)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoints</CardTitle>
          <CardDescription>
            Lista completa de endpoints disponíveis na API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedEndpoint || endpoints[0]?.id} onValueChange={setSelectedEndpoint}>
            <div className="space-y-4">
              {/* Endpoint List */}
              <div className="space-y-2">
                {endpoints.map((endpoint) => (
                  <div
                    key={endpoint.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedEndpoint === endpoint.id ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedEndpoint(endpoint.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`${getMethodColor(endpoint.method)} border`}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground">{endpoint.summary}</span>
                    </div>
                    <div className="flex gap-1">
                      {endpoint.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Endpoint Details */}
              {selectedEndpoint && (() => {
                const endpoint = endpoints.find(e => e.id === selectedEndpoint);
                if (!endpoint) return null;

                return (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getMethodColor(endpoint.method)} border`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-lg font-mono">{endpoint.path}</code>
                      </div>
                      <CardDescription>{endpoint.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="overview">
                        <TabsList>
                          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <TabsTrigger value="parameters">Parâmetros</TabsTrigger>
                          )}
                          {endpoint.requestBody && (
                            <TabsTrigger value="request">Request Body</TabsTrigger>
                          )}
                          <TabsTrigger value="responses">Responses</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Descrição</h4>
                            <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Tags</h4>
                            <div className="flex gap-2">
                              {endpoint.tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <TabsContent value="parameters">
                            <div className="space-y-4">
                              <h4 className="font-medium">Parâmetros</h4>
                              <div className="space-y-3">
                                {endpoint.parameters.map((param, index) => (
                                  <div key={index} className="border rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <code className="text-sm font-mono">{param.name}</code>
                                      <Badge variant="outline" className="text-xs">
                                        {param.in}
                                      </Badge>
                                      {param.required && (
                                        <Badge variant="destructive" className="text-xs">
                                          obrigatório
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {param.description}
                                    </p>
                                    {param.schema && (
                                      <div className="mt-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                          {param.schema.type}
                                        </code>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                        )}

                        {endpoint.requestBody && (
                          <TabsContent value="request">
                            <div className="space-y-4">
                              <h4 className="font-medium">Request Body</h4>
                              <div className="border rounded-lg">
                                <div className="p-3 border-b bg-muted/50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">application/json</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(formatJson(endpoint.requestBody))}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <pre className="p-3 text-xs overflow-auto max-h-64">
                                  {formatJson(endpoint.requestBody)}
                                </pre>
                              </div>
                            </div>
                          </TabsContent>
                        )}

                        <TabsContent value="responses">
                          <div className="space-y-4">
                            <h4 className="font-medium">Responses</h4>
                            <div className="space-y-3">
                              {Object.entries(endpoint.responses).map(([status, response]) => (
                                <div key={status} className="border rounded-lg">
                                  <div className="p-3 border-b bg-muted/50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          className={`${
                                            status.startsWith('2')
                                              ? 'bg-green-100 text-green-800 border-green-200'
                                              : status.startsWith('4')
                                              ? 'bg-red-100 text-red-800 border-red-200'
                                              : 'bg-gray-100 text-gray-800 border-gray-200'
                                          } border`}
                                        >
                                          {status}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                          {response.description}
                                        </span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(formatJson(response))}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  {response.content && (
                                    <pre className="p-3 text-xs overflow-auto max-h-64">
                                      {formatJson(response.content)}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Schemas */}
      {documentation.components.schemas && Object.keys(documentation.components.schemas).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schemas</CardTitle>
            <CardDescription>
              Modelos de dados utilizados pela API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(documentation.components.schemas).map(([name, schema]) => (
                <div key={name} className="border rounded-lg">
                  <div className="p-3 border-b bg-muted/50">
                    <div className="flex items-center justify-between">
                      <code className="font-medium">{name}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(formatJson(schema))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <pre className="p-3 text-xs overflow-auto max-h-64">
                    {formatJson(schema)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}