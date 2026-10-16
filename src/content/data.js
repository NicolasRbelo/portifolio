export const profile = {
  name: 'Nicolas Rabelo de Melo',
  tagline: 'Desenvolvedor Full Stack | Python · React · React Native',
  subtagline: 'Pós-graduando em Cibersegurança (Blue Team)',
  location: 'São Paulo - SP',
  summary:
    'Desenvolvedor Full Stack com quase 2 anos de experiência, único desenvolvedor de um ERP interno construído do zero e usado diariamente por 90 funcionários, que substituiu um sistema legado em Delphi com respostas até 3x mais rápidas. Atuo com Python (Flask, FastAPI), JavaScript/TypeScript (React, React Native), MySQL/PostgreSQL, pytest, Docker e CI/CD com GitHub Actions, seguindo Scrum, SOLID e MVC. Pós-graduando em Cibersegurança (Blue Team) na FIAP, com interesse em desenvolvimento seguro e DevSecOps.',
}

export const contact = {
  phone: '(11) 99467-3016',
  email: 'rabelonicolas01@gmail.com',
  github: { label: 'github.com/NicolasRbelo', url: 'https://github.com/NicolasRbelo' },
  linkedin: {
    label: 'linkedin.com/in/nicolas-rabelo-de-melo',
    url: 'https://linkedin.com/in/nicolas-rabelo-de-melo-9a3a24274',
  },
  whatsapp: {
    label: '(11) 99467-3016',
    url: 'https://wa.me/5511994673016',
  },
  cv: { label: 'Nicolas_Rabelo_Curriculo.pdf', url: `${import.meta.env.BASE_URL}cv/Nicolas_Rabelo_Curriculo.pdf` },
}

export const skills = [
  { group: 'Linguagens', items: ['Python', 'JavaScript', 'TypeScript', 'SQL'] },
  { group: 'Front-end', items: ['React', 'React Native', 'Tailwind CSS', 'HTML', 'CSS'] },
  { group: 'Back-end', items: ['FastAPI', 'Flask', 'API REST'] },
  { group: 'Bancos de Dados', items: ['MySQL', 'PostgreSQL', 'SQLite'] },
  { group: 'Testes e Qualidade', items: ['pytest', 'Testes automatizados', 'Code review'] },
  { group: 'DevOps / Ferramentas', items: ['Docker', 'Git', 'GitHub Actions (CI/CD)', 'Hostinger', 'Vercel'] },
  { group: 'Metodologias', items: ['Scrum', 'SOLID', 'MVC', 'Clean Code'] },
]

export const experience = [
  {
    role: 'Assistente de Programação (atuação como Desenvolvedor Full Stack)',
    org: 'HL Systems',
    period: 'Dezembro/2024 — Atual',
    bullets: [
      'Único desenvolvedor de um ERP interno web, construído do zero para substituir um sistema legado em Delphi, usado diariamente por 90 funcionários — cobrindo pedidos, estoque, clientes (CRM), logística de entregas e RH.',
      'Respostas até 3x mais rápidas que o sistema legado (medido) e redução de 20% no custo operacional, segundo estimativa da gestão.',
      'Front-end em React e API REST em Python/Flask com MySQL, incluindo autenticação e controle de acesso por perfil, seguindo SOLID e MVC.',
      'Testes automatizados com pytest e pipeline de CI/CD com GitHub Actions para deploy na Hostinger.',
      'Conduziu a migração sem interrupção para os usuários, mantendo o sistema legado em operação até a virada.',
      'Em desenvolvimento: app mobile em React Native integrado à mesma API.',
    ],
  },
]

export const projects = [
  {
    name: 'finderCafé',
    stack: 'React, Leaflet, OpenStreetMap, Overpass API, Tailwind CSS',
    status: 'public',
    url: 'https://finder-cafe.vercel.app',
    description:
      'Web app de geolocalização em tempo real que encontra cafeterias num raio de 2,5 km e as exibe em mapa interativo, com buscas geoespaciais via Overpass API (OpenStreetMap) direto no navegador. Interface responsiva com tratamento de edge cases: ausência de resultados, permissão negada e regiões pouco mapeadas.',
  },
  {
    name: 'Bibliopedia',
    stack: 'TypeScript, React, Flask, MySQL',
    status: 'confidential',
    description:
      'Plataforma web full-stack estilo IMDb para avaliação de livros, com sistema de estrelas, comentários e perfis de usuários. Front-end em TypeScript/React e back-end em Flask com API REST e MySQL.',
  },
  {
    name: 'Lookly',
    stack: 'React Native, FastAPI, TypeScript, Docker',
    status: 'confidential',
    description:
      'Aplicativo mobile estilo TikTok voltado para moda, com feed de vídeos curtos. Desenvolvido em React Native com back-end em FastAPI e Docker — em desenvolvimento.',
  },
]

export const education = [
  {
    degree: 'Pós-graduação em Cibersegurança - Blue Team',
    org: 'FIAP',
    period: 'Início: Agosto/2026 (em andamento)',
  },
  {
    degree: 'Tecnólogo em Análise e Desenvolvimento de Sistemas',
    org: 'Impacta Tecnologia',
    period: 'Concluído em Junho/2025',
  },
]

export const certifications = [
  { name: 'Introduction to Cybersecurity', org: 'Cisco', period: 'Junho/2026' },
  { name: 'Segurança da Informação para todos', org: 'Alura', period: 'Agosto/2026' },
]

export const languages = [{ name: 'Inglês', level: 'Nível B1 (intermediário)' }]
