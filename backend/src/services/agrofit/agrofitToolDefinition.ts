import { AssistantTool } from 'openai/resources/beta/assistants'

export const agrofitTools: AssistantTool[] = [
    {
    type: 'function',
    function: {
        name: 'get_product_info',
        description: 'Obtém informações detalhadas sobre um produto Agrofit por nome.',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Nome do produto, ex: "Odin", "Cartago", etc.'
                }
            },
            required: ['name']
        }
    }
},
    {
        type: 'function',
        function: {
            name: 'get_brands',
            description: 'Lista marcas comerciais registradas no Agrofit.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_toxicological_classes',
            description: 'Consulta as classificações toxicológicas existentes.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_environmental_classes',
            description: 'Consulta as classificações ambientais de produtos registrados.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_application_techniques',
            description: 'Consulta técnicas de aplicação registradas no Agrofit.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    }
]
