export type IngredienteAtivoDetalhado = {
    ingrediente_ativo: string;
    grupo_quimico: string;
    concentracao: string;
    unidade_medida: string;
    percentual: string;
};

export type IndicacaoUso = {
    cultura: string;
    praga_nome_cientifico: string;
    praga_nome_comum: string[];
};

export type DocumentoCadastrado = {
    descricao: string;
    tipo_documento: string;
    data_inclusao: string;
    url: string;
    origem: string;
};

export type ProdutoAgrofit = {
    numero_registro: string;
    marca_comercial: string[];
    titular_registro: string;
    classe_categoria_agronomica: string[];
    ingrediente_ativo: string[];
    classificacao_toxicologica: string;
    classificacao_ambiental: string;
    formulacao: string;
    ingrediente_ativo_detalhado: IngredienteAtivoDetalhado[];
    documento_cadastrado: DocumentoCadastrado[];
    url_agrofit: string;
    produto_biologico?: boolean;
    produto_agricultura_organica?: boolean;
    modo_acao?: string[];
    tecnica_aplicacao?: string[];
    indicacao_uso?: IndicacaoUso[];
    inflamavel?: boolean;
    corrosivo?: boolean;
    produto_formulado_vinculado?: {
        marca_comercial: string[];
        numero_registro: string;
        titular_registro: string;
    }[];
};

