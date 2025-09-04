import { NextResponse } from 'next/server';

/**
 * Documentação Swagger para a API do GarapaSystem
 */
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'GarapaSystem API',
    version: '1.0.0',
    description: 'API para gerenciamento de CRM/ERP do GarapaSystem',
    contact: {
      name: 'Suporte GarapaSystem',
      email: 'suporte@garapasystem.com'
    }
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: 'Servidor de desenvolvimento'
    }
  ],
  tags: [
    {
      name: 'API Keys',
      description: 'Gerenciamento de chaves de API'
    },
    {
      name: 'Webhooks',
      description: 'Configuração e gerenciamento de webhooks'
    },
    {
      name: 'Logs',
      description: 'Visualização de logs de API e webhooks'
    },
    {
      name: 'Configurações',
      description: 'Configurações gerais do sistema'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Chave de API para autenticação'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensagem de erro'
          }
        }
      },
      ApiKey: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único da chave'
          },
          nome: {
            type: 'string',
            description: 'Nome descritivo da chave'
          },
          chave: {
            type: 'string',
            description: 'Chave de API'
          },
          ativo: {
            type: 'boolean',
            description: 'Status da chave'
          },
          ultimoUso: {
            type: 'string',
            format: 'date-time',
            description: 'Data do último uso'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de expiração'
          },
          permissoes: {
            type: 'object',
            description: 'Permissões da chave'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criação'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de atualização'
          }
        }
      },
      WebhookConfig: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único da configuração'
          },
          nome: {
            type: 'string',
            description: 'Nome descritivo do webhook'
          },
          url: {
            type: 'string',
            format: 'uri',
            description: 'URL de destino'
          },
          evento: {
            type: 'string',
            enum: ['cliente.criado', 'cliente.atualizado', 'oportunidade.criada', 'oportunidade.atualizada', 'oportunidade.fechada'],
            description: 'Tipo de evento'
          },
          ativo: {
            type: 'boolean',
            description: 'Status do webhook'
          },
          secret: {
            type: 'string',
            description: 'Chave secreta para assinatura'
          },
          headers: {
            type: 'object',
            description: 'Headers customizados'
          },
          ultimoEnvio: {
            type: 'string',
            format: 'date-time',
            description: 'Data do último envio'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criação'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de atualização'
          }
        }
      },
      WebhookPayload: {
        type: 'object',
        properties: {
          evento: {
            type: 'string',
            description: 'Tipo do evento'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp do evento'
          },
          data: {
            type: 'object',
            description: 'Dados do evento'
          },
          test: {
            type: 'boolean',
            description: 'Indica se é um teste'
          }
        },
        example: {
          evento: 'cliente.criado',
          timestamp: '2024-01-15T10:30:00Z',
          data: {
            id: 'cliente-123',
            nome: 'João Silva',
            email: 'joao@exemplo.com',
            telefone: '(11) 99999-9999'
          },
          test: false
        }
      },
      ApiLog: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único do log'
          },
          apiKeyId: {
            type: 'string',
            description: 'ID da chave de API utilizada'
          },
          endpoint: {
            type: 'string',
            description: 'Endpoint acessado'
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'Método HTTP'
          },
          status: {
            type: 'integer',
            description: 'Status HTTP da resposta'
          },
          tempoResposta: {
            type: 'integer',
            description: 'Tempo de resposta em ms'
          },
          ip: {
            type: 'string',
            description: 'IP do cliente'
          },
          userAgent: {
            type: 'string',
            description: 'User Agent do cliente'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criação'
          }
        }
      },
      WebhookLog: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID único do log'
          },
          webhookConfigId: {
            type: 'string',
            description: 'ID da configuração de webhook'
          },
          evento: {
            type: 'string',
            description: 'Tipo do evento'
          },
          url: {
            type: 'string',
            description: 'URL de destino'
          },
          payload: {
            type: 'string',
            description: 'Payload enviado'
          },
          status: {
            type: 'integer',
            description: 'Status HTTP da resposta'
          },
          response: {
            type: 'string',
            description: 'Resposta recebida'
          },
          tempoResposta: {
            type: 'integer',
            description: 'Tempo de resposta em ms'
          },
          sucesso: {
            type: 'boolean',
            description: 'Indica se o envio foi bem-sucedido'
          },
          teste: {
            type: 'boolean',
            description: 'Indica se foi um teste'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Data de criação'
          }
        }
      }
    }
  },
  paths: {
    '/api/api-keys': {
      get: {
        summary: 'Lista todas as chaves de API',
        tags: ['API Keys'],
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Lista de chaves de API',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ApiKey' }
                }
              }
            }
          },
          401: {
            description: 'Não autorizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      post: {
        summary: 'Cria uma nova chave de API',
        tags: ['API Keys'],
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome'],
                properties: {
                  nome: {
                    type: 'string',
                    description: 'Nome descritivo da chave'
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Data de expiração (opcional)'
                  },
                  permissoes: {
                    type: 'object',
                    description: 'Permissões específicas da chave'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Chave de API criada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiKey' }
              }
            }
          },
          400: {
            description: 'Dados inválidos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/webhooks': {
      get: {
        summary: 'Lista todas as configurações de webhook',
        tags: ['Webhooks'],
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'Lista de configurações de webhook',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/WebhookConfig' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Cria uma nova configuração de webhook',
        tags: ['Webhooks'],
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome', 'url', 'evento'],
                properties: {
                  nome: {
                    type: 'string',
                    description: 'Nome descritivo do webhook'
                  },
                  url: {
                    type: 'string',
                    format: 'uri',
                    description: 'URL de destino do webhook'
                  },
                  evento: {
                    type: 'string',
                    enum: ['cliente.criado', 'cliente.atualizado', 'oportunidade.criada', 'oportunidade.atualizada', 'oportunidade.fechada'],
                    description: 'Tipo de evento que dispara o webhook'
                  },
                  secret: {
                    type: 'string',
                    description: 'Chave secreta para assinatura do webhook'
                  },
                  headers: {
                    type: 'object',
                    description: 'Headers customizados para o webhook'
                  },
                  ativo: {
                    type: 'boolean',
                    description: 'Se o webhook está ativo',
                    default: true
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Configuração de webhook criada com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WebhookConfig' }
              }
            }
          }
        }
      }
    }
  }
};

export async function GET() {
  return NextResponse.json(swaggerSpec);
}