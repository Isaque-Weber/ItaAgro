// backend/src/services/agrofit/agrofitTool.ts
import { AgrofitService } from "./agrofitService"
import { toAgentProductDto } from "../../utils/agrofitAgentDto"

export class AgrofitTool {
    private service: AgrofitService

    constructor() {
        this.service = new AgrofitService()
    }

    async handleFunctionCall(name: string, args: any) {
        console.log(`[AGROFIT TOOL] Chamada:`, name, '| Args:', args);
        switch (name) {
            case 'get_product_info':
                if (!args.brand) {
                    return { error: 'Preciso do parâmetro "brand" para buscar.' };
                }
                // Busca produtos por marca comercial
                const produtos = await this.service.getProductByBrand(args.brand);
                if (!produtos || !produtos.length) return [];
                // Limite para evitar excesso de tokens (2 produtos no máximo)
                return produtos.slice(0, 2).map(toAgentProductDto);

            case 'get_brands':
                return await this.service.getBrands(1);

            case 'get_toxicological_classes':
                return await this.service.simpleGet('/classificacoes-toxicologicas');

            case 'get_environmental_classes':
                return await this.service.simpleGet('/classificacoes-ambientais');

            case 'get_application_techniques':
                return await this.service.simpleGet('/tecnicas-aplicacoes');

            default:
                return { error: `Função ${name} não reconhecida na AgrofitTool.` }
        }
    }
}
