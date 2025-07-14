// utils/agrofitAgentDto.ts
import { ProdutoAgrofit } from '../../@types/agrofit'

export function toAgentProductDto(prod: ProdutoAgrofit) {
    return {
        numero_registro: prod.numero_registro,
        marca_comercial: prod.marca_comercial?.slice(0, 3), // no máximo 3 marcas
        titular_registro: prod.titular_registro,
        classe_categoria_agronomica: prod.classe_categoria_agronomica,
        formulacao: prod.formulacao,
        ingrediente_ativo: prod.ingrediente_ativo?.slice(0, 3), // no máximo 3 ingredientes
        classificacao_toxicologica: prod.classificacao_toxicologica,
        classificacao_ambiental: prod.classificacao_ambiental,
        url_agrofit: prod.url_agrofit,
        produto_biologico: prod.produto_biologico,
        produto_agricultura_organica: prod.produto_agricultura_organica,
        // Só as 2 primeiras indicações de uso para não explodir tokens
        indicacao_uso: prod.indicacao_uso?.slice(0, 2) ?? [],
        // Só os 2 primeiros documentos, se existirem
        documento_cadastrado: prod.documento_cadastrado?.slice(0, 2) ?? [],
        // Só o primeiro ingrediente detalhado, se existir
        ingrediente_ativo_detalhado: prod.ingrediente_ativo_detalhado?.slice(0, 1) ?? [],
    }
}
