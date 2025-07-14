import axios, { AxiosInstance } from 'axios'
import { AppDataSource } from '../typeorm/data-source'
import { Product } from '../../entities/Product'
import { Culture } from '../../entities/Culture'
import { Pest } from '../../entities/Pest'
import { Brand } from '../../entities/Brand'
import { ActiveIngredient } from '../../entities/ActiveIngredient'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { ProdutoAgrofit } from '../../../@types/agrofit'

dotenv.config()

/**
 * Filtros para busca de produtos na API Agrofit.
 * Use exatamente os parâmetros aceitos pelo endpoint.
 */
interface ProductFilter {
    marca_comercial?: string | string[];
    ingrediente_ativo?: string | string[];
    titular_registro?: string;
    cultura?: string | string[];
    praga?: string | string[];
    page?: number;
}

type ProductType = 'formulado' | 'tecnico'

export class AgrofitService {
    private apiClient: AxiosInstance;
    private baseURL = 'https://api.cnptia.embrapa.br/agrofit/v1';
    private requestsThisMonth = 0;
    private requestLimit = 100000;
    private alertThreshold: number;
    private mailer;

    constructor() {
        this.requestLimit = parseInt(process.env.AGROFIT_REQUEST_LIMIT || '100000', 10)
        this.alertThreshold = Math.floor(this.requestLimit * 0.8)

        this.apiClient = axios.create({
            baseURL: process.env.AGROFIT_BASE_URL || this.baseURL,
            headers: { Authorization: `Bearer ${process.env.AGROFIT_ACCESS_TOKEN}` }
        })

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
     * Busca produtos por marca comercial (usando o nome correto do parâmetro)
     */
    async getProductByBrand(marca_comercial: string) {
        if (!marca_comercial) throw new Error('Parâmetro "marca_comercial" é obrigatório.');
        const filtro: ProductFilter = { marca_comercial, page: 1 };
        let res = await this.getProducts(filtro, 'formulado');
        if (!res.length) {
            res = await this.getProducts(filtro, 'tecnico');
        }
        return res;
    }

    /**
     * Busca produtos, com filtros nos nomes reais dos parâmetros
     */
    async getProducts(
        filters: ProductFilter = {},
        type: ProductType = 'formulado'
    ): Promise<ProdutoAgrofit[]> {
        const endpoint = type === 'formulado'
            ? '/produtos-formulados'
            : '/produtos-tecnicos';
        const searchEndpoint = `/search${endpoint}`;

        // Só adiciona parâmetros que existem
        const params: Record<string, any> = {};
        if (filters.page) params.page = filters.page;
        if (filters.marca_comercial) params.marca_comercial = filters.marca_comercial;
        if (filters.ingrediente_ativo) params.ingrediente_ativo = filters.ingrediente_ativo;
        if (filters.titular_registro) params.titular_registro = filters.titular_registro;
        if (filters.cultura) params.cultura = filters.cultura;
        if (filters.praga) params.praga = filters.praga;

        // marca_comercial pode ser obrigatório para formulados
        if (type === 'formulado' && !filters.marca_comercial) {
            throw new Error('O filtro "marca_comercial" é obrigatório para buscar produtos formulados');
        }

        console.log(`[AGROFIT SERVICE] GET ${searchEndpoint} | Params:`, params);

        try {
            const res = await this.apiClient.get<ProdutoAgrofit[]>(searchEndpoint, { params });
            const qtd = res.data.length || 0;
            console.log(`[AGROFIT SERVICE] Resultados recebidos: ${qtd} para marca_comercial="${filters.marca_comercial}" [Tipo: ${type}]`);
            return res.data;
        } catch (err: any) {
            console.error(`[AGROFIT SERVICE] ERRO na consulta: ${searchEndpoint}`, err?.message || err);
            throw err;
        }
    }

    // Os métodos de busca abaixo usam sempre nomes reais dos campos
    async getPests(nome?: string, page: number = 1): Promise<any[]> {
        try {
            const response = await this.apiClient.get('/pragas', {
                params: { nome, page }
            });
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Erro ao buscar pragas:', error);
            throw error;
        }
    }

    async getCultures(nome?: string, page: number = 1): Promise<any[]> {
        try {
            const response = await this.apiClient.get('/culturas', {
                params: { nome, page }
            });
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Erro ao buscar culturas:', error);
            throw error;
        }
    }

    async getBrands(page: number = 1): Promise<any[]> {
        try {
            const response = await this.apiClient.get('/marcas-comerciais', {
                params: { page }
            });
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Erro ao buscar marcas:', error);
            throw error;
        }
    }

    async getActiveIngredients(nome?: string, page: number = 1): Promise<any[]> {
        try {
            const response = await this.apiClient.get('/ingredientes-ativos', {
                params: { nome, page }
            });
            return Array.isArray(response.data) ? response.data : [];
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
     * Sincroniza dados da API Agrofit com o banco de dados local.
     * Toda referência a campos e filtros usa agora os nomes reais da API.
     */
    async syncData() {
        try {
            const productRepo = AppDataSource.getRepository(Product);
            const cultureRepo = AppDataSource.getRepository(Culture);
            const pestRepo = AppDataSource.getRepository(Pest);
            const brandRepo = AppDataSource.getRepository(Brand);
            const activeIngredientRepo = AppDataSource.getRepository(ActiveIngredient);

            // Sincroniza marcas
            const brands = await this.getBrands(1);
            for (const brandData of brands) {
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
            const activeIngredients = await this.getActiveIngredients(undefined, 1);
            for (const aiData of activeIngredients) {
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
            const cultures = await this.getCultures(undefined, 1);
            for (const cultureData of cultures) {
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
            const pests = await this.getPests(undefined, 1);
            for (const pestData of pests) {
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

            // Sincroniza produtos (busca só produtos formulados e pega a primeira marca comercial)
            const products = await this.getProducts({ page: 1, marca_comercial: brands[0]?.nome });
            for (const productData of products) {
                let product = await productRepo.findOne({
                    where: { registrationNumber: productData.numero_registro },
                    relations: ['cultures', 'pests', 'activeIngredients', 'brand']
                });

                if (!product) {
                    product = new Product();
                }

                // Dados básicos
                product.name = productData.numero_registro; // Se tiver campo nome, ajuste aqui!
                product.registrationNumber = productData.numero_registro;
                product.holder = productData.titular_registro;
                product.toxicologicalClass = productData.classificacao_toxicologica;
                product.environmentalClass = productData.classificacao_ambiental;
                product.formulationType = productData.formulacao;
                product.isBiological = productData.produto_biologico || false;
                product.isOrganic = productData.produto_agricultura_organica || false;
                product.additionalData = productData;

                // Marca comercial (pega a primeira do array)
                if (Array.isArray(productData.marca_comercial) && productData.marca_comercial.length > 0) {
                    const brandName = productData.marca_comercial[0];
                    const brand = await brandRepo.findOne({ where: { name: brandName } });
                    if (brand) {
                        product.brand = brand;
                    }
                }

                await productRepo.save(product);

                // Culturas
                product.cultures = [];
                if (Array.isArray(productData.indicacao_uso)) {
                    for (const ind of productData.indicacao_uso) {
                        const culture = await cultureRepo.findOne({ where: { name: ind.cultura } });
                        if (culture) product.cultures.push(culture);
                    }
                } else if (Array.isArray(productData.classe_categoria_agronomica)) {
                    for (const cultureName of productData.classe_categoria_agronomica) {
                        const culture = await cultureRepo.findOne({ where: { name: cultureName } });
                        if (culture) product.cultures.push(culture);
                    }
                }

                // Pragas
                product.pests = [];
                if (Array.isArray(productData.indicacao_uso)) {
                    for (const ind of productData.indicacao_uso) {
                        for (const pestName of (ind.praga_nome_comum || [])) {
                            const pest = await pestRepo.findOne({ where: { commonName: pestName } });
                            if (pest) product.pests.push(pest);
                        }
                    }
                }

                // Ingredientes ativos
                product.activeIngredients = [];
                if (Array.isArray(productData.ingrediente_ativo)) {
                    for (const aiName of productData.ingrediente_ativo) {
                        const ai = await activeIngredientRepo.findOne({ where: { name: aiName } });
                        if (ai) product.activeIngredients.push(ai);
                    }
                }

                await productRepo.save(product);
            }

            return {
                success: true,
                message: 'Sincronização concluída com sucesso',
                stats: {
                    brands: brands.length,
                    activeIngredients: activeIngredients.length,
                    cultures: cultures.length,
                    pests: pests.length,
                    products: products.length
                }
            };
        } catch (error) {
            console.error('Erro na sincronização:', error);
            throw error;
        }
    }
}
