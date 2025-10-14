const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const modulo = await prisma.moduloSistema.findUnique({ where: { nome: 'financeiro' } });

    if (modulo) {
      console.log(
        JSON.stringify(
          {
            exists: true,
            id: modulo.id,
            nome: modulo.nome,
            titulo: modulo.titulo,
            ativo: modulo.ativo,
            rota: modulo.rota,
            permissao: modulo.permissao,
            categoria: modulo.categoria,
          },
          null,
          2
        )
      );
    } else {
      const matches = await prisma.moduloSistema.findMany({
        where: {
          OR: [
            { nome: { contains: 'financeiro', mode: 'insensitive' } },
            { titulo: { contains: 'financeiro', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
      });

      console.log(
        JSON.stringify(
          {
            exists: false,
            matches,
          },
          null,
          2
        )
      );
    }
  } catch (e) {
    console.error('ERROR', e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();