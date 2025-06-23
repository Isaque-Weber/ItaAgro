// backend/src/services/agrofit/agrofitTool.ts
import { AgrofitService } from "./agrofitService"

export class AgrofitTool {
    private service: AgrofitService

    constructor() {
        this.service = new AgrofitService()
    }

    async handleFunctionCall(name: string, args: any) {
        switch (name) {
            case 'get_product_info':
                return await this.service.getProducts({ name: args.name })
            case 'get_brands':
                return await this.service.getBrands(1, 100)
            case 'get_toxicological_classes':
                return await this.service.simpleGet('/classificacoes-toxicologicas')
            case 'get_environmental_classes':
                return await this.service.simpleGet('/classificacoes-ambientais')
            case 'get_application_techniques':
                return await this.service.simpleGet('/tecnicas-aplicacoes')
            default:
                return { error: `Função ${name} não reconhecida na AgrofitTool.` }
        }
    }
}