import axios, { AxiosInstance } from 'axios'
import { AppDataSource } from '../typeorm/data-source'
import { Product } from '../../entities/Product'
import { Culture } from '../../entities/Culture'
import { Pest } from '../../entities/Pest'
import { Brand } from '../../entities/Brand'
import { ActiveIngredient } from '../../entities/ActiveIngredient'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { SearchResponse } from '../../../@types/agrofit';

dotenv.config()

/**
 * Interface para os filtros de busca de produtos
 */
interface ProductFilter {
    culture?: string;
    pest?: string;
    activeIngredient?: string;
    brand?: string;
    holder?: string;
    name?: string;
    page?: number;
    limit?: number;
}
/**
 * Interface para a resposta de busca de produtos
 */
type ProductType = 'formulado' | 'tecnico'

/**
 * Cliente para integração com a API Agrofit
 */
export class AgrofitService {
    private apiClient: AxiosInstance;
    private baseURL = 'https://api.cnptia.embrapa.br/agrofit/v1';
    private requestsThisMonth = 0;
    private requestLimit = 100000; // Limite do plano gratuito
    private alertThreshold: number
    private mailer

    constructor() {

        this.requestLimit = parseInt(process.env.AGROFIT_REQUEST_LIMIT || '100000', 10)
        this.alertThreshold = Math.floor(this.requestLimit * 0.8)

        // Inicializa o cliente HTTP
        this.apiClient = axios.create({
            baseURL: process.env.AGROFIT_BASE_URL || 'https://api.cnptia.embrapa.br/agrofit/v1',
            headers: { Authorization: `Bearer ${process.env.AGROFIT_ACCESS_TOKEN}` }
        })

        // Interceptor para contagem de requisições
        this.apiClient.interceptors.request.use(async config => {
            this.requestsThisMonth++;
            if (this.requestsThisMonth === this.alertThreshold) {
                await this.sendAlertEmail('⚠️ Você atingiu 80% do limite mensal de requisições');
            }
            if (this.requestsThisMonth > this.requestLimit) {
                await this.sendAlertEmail('❌ Limite mensal de requisições excedido');
                throw new Error('Limite mensal de requisições excedido');
            }
            return config;
        })

        // Configuração do transportador de email
        this.mailer = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }

    private async sendAlertEmail(message: string) {
        try {
            await this.mailer.sendMail({
                from: process.env.SMTP_FROM,
                to: process.env.ALERT_EMAIL,
                subject: message,
                text: `AgrofitService: ${message}\nTotal de requisições no mês: ${this.requestsThisMonth}`
            });
            console.log('🚨 Alerta enviado:', message);
        } catch (err) {
            console.error('Erro ao enviar e‑mail de alerta:', err);
        }
    }

    // Exemplo de obtenção de token via client credentials
    async refreshToken() {
        const url = process.env.TOKEN_URL!;
        const data = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.AGROFIT_CONSUMER_KEY!,
            client_secret: process.env.AGROFIT_CONSUMER_SECRET!
        });
        const resp = await axios.post(url, data.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const token = resp.data.access_token;
        this.apiClient.defaults.headers.Authorization = `Bearer ${token}`;
        process.env.AGROFIT_ACCESS_TOKEN = token;
        console.log('🔄 Token renovado automaticamente');
    }

    /**
     * Busca produtos na API Agrofit com filtros
     */
    async getProducts(
        filters: ProductFilter = {},
        type: ProductType = 'formulado'
    ) {
        const endpointBase = type === 'formulado'
            ? '/produtos-formulados'
            : '/produtos-tecnicos';

        const searchBase = `/search${endpointBase}`;

        const { page = 1, limit = 20, name, culture, pest, brand, holder, activeIngredient } = filters;
        const params: Record<string, any> = { page, limit };

        if (name)             params.nome = name;
        if (culture)          params.cultura = culture;
        if (pest)             params.praga = pest;
        if (brand)            params.marca = brand;
        if (holder)           params.titular = holder;
        if (activeIngredient) params.ingredienteAtivo = activeIngredient;

        // Tenta busca simples primeiro, depois fallback via search
        try {
            const res = await this.apiClient.get<SearchResponse>(`${endpointBase}`, { params });
            return res.data;
        } catch (err) {
            if ((err as any).response?.status === 404) {
                const res2 = await this.apiClient.get<SearchResponse>(`${searchBase}`, { params });
                return res2.data;
            }
            throw err;
        }
    }

    /**
     * Busca pragas na API Agrofit
     */
    async getPests(name?: string, page: number = 1, limit: number = 20) {
        try {
            const response = await this.apiClient.get('/pragas', {
                params: {
                    nome: name,
                    page,
                    limit
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar pragas:', error);
            throw error;
        }
    }

    /**
     * Busca culturas na API Agrofit
     */
    async getCultures(name?: string, page: number = 1, limit: number = 20) {
        try {
            const response = await this.apiClient.get('/culturas', {
                params: {
                    nome: name,
                    page,
                    limit
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar culturas:', error);
            throw error;
        }
    }

    /**
     * Busca marcas na API Agrofit
     */
    async getBrands(page: number = 1, limit: number = 20) {
        try {
            const response = await this.apiClient.get('/marcas-comerciais', {
                params: {
                    page,
                    limit
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar marcas:', error);
            throw error;
        }
    }

    /**
     * Busca ingredientes ativos na API Agrofit
     */
    async getActiveIngredients(name?: string, page: number = 1, limit: number = 20) {
        try {
            const response = await this.apiClient.get('/ingredientes-ativos', {
                params: {
                    nome: name,
                    page,
                    limit
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar ingredientes ativos:', error);
            throw error;
        }
    }

    async simpleGet(path: string) {
        try {
            const response = await this.apiClient.get(path)
            return response.data
        } catch (error) {
            console.error(`Erro ao acessar ${path}:`, error)
            throw error
        }
    }

    /**
     * Sincroniza dados da API Agrofit com o banco de dados local
     */
    async syncData() {
        try {
            // Inicializa repositórios
            const productRepo = AppDataSource.getRepository(Product);
            const cultureRepo = AppDataSource.getRepository(Culture);
            const pestRepo = AppDataSource.getRepository(Pest);
            const brandRepo = AppDataSource.getRepository(Brand);
            const activeIngredientRepo = AppDataSource.getRepository(ActiveIngredient);

            // Sincroniza marcas
            const brands = await this.getBrands(1, 100);
            for (const brandData of brands.items) {
                let brand = await brandRepo.findOne({ where: { name: brandData.nome } });
                
                if (!brand) {
                    brand = new Brand();
                    brand.name = brandData.nome;
                    brand.company = brandData.empresa;
                    brand.additionalData = brandData;
                    await brandRepo.save(brand);
                }
            }

            // Sincroniza ingredientes ativos
            const activeIngredients = await this.getActiveIngredients(undefined, 1, 100);
            for (const aiData of activeIngredients.items) {
                let ai = await activeIngredientRepo.findOne({ where: { name: aiData.nome } });
                
                if (!ai) {
                    ai = new ActiveIngredient();
                    ai.name = aiData.nome;
                    ai.chemicalGroup = aiData.grupo_quimico;
                    ai.actionMode = aiData.modo_acao;
                    ai.additionalData = aiData;
                    await activeIngredientRepo.save(ai);
                }
            }

            // Sincroniza culturas
            const cultures = await this.getCultures(undefined, 1, 100);
            for (const cultureData of cultures.items) {
                let culture = await cultureRepo.findOne({ where: { name: cultureData.nome_comum } });
                
                if (!culture) {
                    culture = new Culture();
                    culture.name = cultureData.nome_comum;
                    culture.scientificName = cultureData.nome_cientifico;
                    culture.group = cultureData.grupo;
                    culture.additionalData = cultureData;
                    await cultureRepo.save(culture);
                }
            }

            // Sincroniza pragas
            const pests = await this.getPests(undefined, 1, 100);
            for (const pestData of pests.items) {
                let pest = await pestRepo.findOne({ where: { commonName: pestData.nome_comum } });
                
                if (!pest) {
                    pest = new Pest();
                    pest.commonName = pestData.nome_comum;
                    pest.scientificName = pestData.nome_cientifico;
                    pest.type = pestData.tipo;
                    pest.additionalData = pestData;
                    await pestRepo.save(pest);
                }
            }

            // Sincroniza produtos (limitado a 100 para não exceder limites da API)
            const products = await this.getProducts({ page: 1, limit: 100 });
            for (const productData of products.items) {
                let product = await productRepo.findOne({ 
                    where: { registrationNumber: productData.numero_registro },
                    relations: ['cultures', 'pests', 'activeIngredients', 'brand']
                });
                
                if (!product) {
                    product = new Product();
                }
                
                // Atualiza dados básicos
                product.name = productData.nome;
                product.registrationNumber = productData.numero_registro;
                product.holder = productData.titular;
                product.toxicologicalClass = productData.classe_toxicologica;
                product.environmentalClass = productData.classe_ambiental;
                product.formulationType = productData.tipo_formulacao;
                product.applicationMode = productData.modo_aplicacao;
                product.isBiological = productData.biologico || false;
                product.isOrganic = productData.organico || false;
                product.additionalData = productData;
                
                // Associa marca se existir
                if (productData.marca) {
                    const brand = await brandRepo.findOne({ where: { name: productData.marca } });
                    if (brand) {
                        product.brand = brand;
                    }
                }
                
                // Salva o produto para obter o ID
                await productRepo.save(product);
                
                // Associa culturas
                if (productData.culturas && Array.isArray(productData.culturas)) {
                    product.cultures = [];
                    for (const cultureName of productData.culturas) {
                        const culture = await cultureRepo.findOne({ where: { name: cultureName } });
                        if (culture) {
                            product.cultures.push(culture);
                        }
                    }
                }
                
                // Associa pragas
                if (productData.pragas && Array.isArray(productData.pragas)) {
                    product.pests = [];
                    for (const pestName of productData.pragas) {
                        const pest = await pestRepo.findOne({ where: { commonName: pestName } });
                        if (pest) {
                            product.pests.push(pest);
                        }
                    }
                }
                
                // Associa ingredientes ativos
                if (productData.ingredientes_ativos && Array.isArray(productData.ingredientes_ativos)) {
                    product.activeIngredients = [];
                    for (const aiName of productData.ingredientes_ativos) {
                        const ai = await activeIngredientRepo.findOne({ where: { name: aiName } });
                        if (ai) {
                            product.activeIngredients.push(ai);
                        }
                    }
                }
                
                // Salva o produto com todas as relações
                await productRepo.save(product);
            }
            
            return {
                success: true,
                message: 'Sincronização concluída com sucesso',
                stats: {
                    brands: brands.items.length,
                    activeIngredients: activeIngredients.items.length,
                    cultures: cultures.items.length,
                    pests: pests.items.length,
                    products: products.items.length
                }
            };
        } catch (error) {
            console.error('Erro na sincronização:', error);
            throw error;
        }
    }
}