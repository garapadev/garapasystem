import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  CONDITION_OPTIONS, 
  ACTION_OPTIONS,
  AUTOMATION_CONDITIONS,
  AUTOMATION_ACTIONS
} from '@/lib/tasks/automation-constants';

/**
 * GET /api/tasks/automation/options
 * Retorna as opções válidas para condições e ações de automação
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'conditions', 'actions', ou 'all'
    const category = searchParams.get('category'); // filtro por categoria

    let response: any = {};

    // Retornar condições
    if (!type || type === 'all' || type === 'conditions') {
      let conditions = CONDITION_OPTIONS;
      
      // Filtrar por categoria se especificado
      if (category) {
        conditions = conditions.filter(option => 
          option.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Formato simples para compatibilidade com a página
      response.conditions = conditions.map(opt => ({
        value: opt.value,
        label: opt.label
      }));
    }

    // Retornar ações
    if (!type || type === 'all' || type === 'actions') {
      let actions = ACTION_OPTIONS;
      
      // Filtrar por categoria se especificado
      if (category) {
        actions = actions.filter(option => 
          option.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      // Formato simples para compatibilidade com a página
      response.actions = actions.map(opt => ({
        value: opt.value,
        label: opt.label
      }));
    }

    // Adicionar metadados
    response.metadata = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      totalConditions: Object.keys(AUTOMATION_CONDITIONS).length,
      totalActions: Object.keys(AUTOMATION_ACTIONS).length
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[ERROR] Erro ao buscar opções de automação:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível carregar as opções de automação'
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/automation/options/validate
 * Valida se uma condição ou ação é válida
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { condition, action, rules } = body;

    const validation: any = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Validar condição
    if (condition !== undefined) {
      const isValidCondition = Object.values(AUTOMATION_CONDITIONS).includes(condition);
      if (!isValidCondition) {
        validation.valid = false;
        validation.errors.push(`Condição inválida: ${condition}`);
      } else {
        validation.condition = {
          valid: true,
          value: condition,
          label: CONDITION_OPTIONS.find(opt => opt.value === condition)?.label
        };
      }
    }

    // Validar ação
    if (action !== undefined) {
      const isValidAction = Object.values(AUTOMATION_ACTIONS).includes(action);
      if (!isValidAction) {
        validation.valid = false;
        validation.errors.push(`Ação inválida: ${action}`);
      } else {
        validation.action = {
          valid: true,
          value: action,
          label: ACTION_OPTIONS.find(opt => opt.value === action)?.label
        };
      }
    }

    // Validar regras completas se fornecidas
    if (rules && Array.isArray(rules)) {
      validation.rules = rules.map((rule: any, index: number) => {
        const ruleValidation: any = {
          index,
          valid: true,
          errors: []
        };

        // Validar condição da regra
        if (rule.condition && !Object.values(AUTOMATION_CONDITIONS).includes(rule.condition)) {
          ruleValidation.valid = false;
          ruleValidation.errors.push(`Condição inválida na regra ${index + 1}: ${rule.condition}`);
        }

        // Validar ação da regra
        if (rule.action && !Object.values(AUTOMATION_ACTIONS).includes(rule.action)) {
          ruleValidation.valid = false;
          ruleValidation.errors.push(`Ação inválida na regra ${index + 1}: ${rule.action}`);
        }

        // Validar etapas
        if (rule.fromStep && rule.toStep && rule.fromStep === rule.toStep) {
          ruleValidation.valid = false;
          ruleValidation.errors.push(`Etapa de origem e destino não podem ser iguais na regra ${index + 1}`);
        }

        if (!ruleValidation.valid) {
          validation.valid = false;
          validation.errors.push(...ruleValidation.errors);
        }

        return ruleValidation;
      });
    }

    return NextResponse.json(validation, { status: 200 });

  } catch (error) {
    console.error('[ERROR] Erro ao validar opções de automação:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Não foi possível validar as opções de automação'
      }, 
      { status: 500 }
    );
  }
}