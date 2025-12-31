import React from 'react'
import { Link } from 'react-router-dom'
import { Bot, BookOpen, TestTubes, CloudRain, Package, Zap, Database, CloudSun, ShieldCheck } from 'lucide-react'
import { useDarkMode } from '../../contexts/DarkModeContext'
import './styles.css'

import logoImg from '../../assets/logo-removebg-preview.png'

export function LandingPage() {
    const { darkMode, toggleDarkMode } = useDarkMode()

    return (
        <div className="landing-body">
            <nav className="nav">
                <div className="logo">
                    <img src={logoImg} alt="itaAgroIA" />
                </div>
                <div className="nav-actions">
                    <Link to="/chat" className="cta-button">
                        <span>Acessar Chat</span>
                    </Link>

                    <button className="theme-toggle-btn" onClick={toggleDarkMode}>
                        <span className="theme-icon">{darkMode ? '🌙' : '☀️'}</span>
                        {/*<span className="theme-text">{darkMode ? 'Claro' : 'Escuro'}</span>*/}
                    </button>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-content">
                    <div className="hero-logo-container">
                        <img src={logoImg} alt="itaAgroIA" />
                    </div>
                    <h1 className="landing-h1">Inteligência Artificial para o Agronegócio Brasileiro</h1>
                    <p className="subtitle">Consultoria agronômica instantânea com dados oficiais e clima em tempo real</p>
                    <div className="hero-cta">
                        <Link to="/chat" className="cta-button">
                            <span>Acessar Chat</span>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="features">
                <h2 className="section-title">Tudo pronto quando você também estiver</h2>
                <p className="section-subtitle">Ferramentas inteligentes para otimizar sua produção agrícola</p>
                <div className="features-grid">
                    <div className="feature-card">
                        <Bot className="feature-icon" />
                        <h3>Chat com IA Especializada</h3>
                        <p>Assistente inteligente treinado para o agronegócio brasileiro, respondendo suas dúvidas técnicas com precisão e rapidez.</p>
                    </div>
                    <div className="feature-card">
                        <BookOpen className="feature-icon" />
                        <h3>Consultar Bula</h3>
                        <p>Acesso direto à base Agrofit do Ministério da Agricultura com informações completas sobre defensivos agrícolas registrados.</p>
                    </div>
                    <div className="feature-card">
                        <TestTubes className="feature-icon" />
                        <h3>Análise de Solo</h3>
                        <p>Interprete resultados de análise de solo e receba recomendações personalizadas baseadas em dados científicos.</p>
                    </div>
                    <div className="feature-card">
                        <CloudRain className="feature-icon" />
                        <h3>Clima em Tempo Real</h3>
                        <p>Dados meteorológicos atualizados para auxiliar no planejamento e tomada de decisões baseadas nas condições climáticas.</p>
                    </div>
                    <div className="feature-card">
                        <Package className="feature-icon" />
                        <h3>Ajuda sobre Produtos</h3>
                        <p>Orientações detalhadas sobre aplicação, dosagem e compatibilidade de produtos agrícolas para sua cultura.</p>
                    </div>
                    <div className="feature-card">
                        <Zap className="feature-icon" />
                        <h3>Respostas Instantâneas</h3>
                        <p>Tecnologia de ponta que processa suas consultas em segundos, economizando tempo na gestão da sua propriedade.</p>
                    </div>
                </div>
            </section>

            <section className="data-sources">
                <div className="sources-container">
                    <h2 className="section-title">Fontes de Dados Confiáveis</h2>
                    <p className="section-subtitle">Todas as informações são baseadas em fontes oficiais e verificadas</p>
                    <div className="source-badges">
                        <div className="badge">
                            <Database size={20} />
                            Base Agrofit MAPA
                        </div>
                        <div className="badge">
                            <CloudSun size={20} />
                            Dados Climáticos em Tempo Real
                        </div>
                        <div className="badge">
                            <ShieldCheck size={20} />
                            Informações Verificadas
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <h2>Pronto para revolucionar sua gestão agronômica?</h2>
                <p>Junte-se aos produtores que já utilizam IA para tomar decisões mais inteligentes no campo.</p>
                <Link to="/chat" className="cta-button">
                    <span>Acessar Chat</span>
                </Link>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2025 itaAgroIA - Tecnologia para o Agronegócio Brasileiro</p>
            </footer>
        </div>
    )
}
