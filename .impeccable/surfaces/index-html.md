---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

## Direction contract

THESIS: A "Vault Overseer Terminal" — o visitante entra como se estivesse sentado dentro de um bunker Vault-Tec, numa cena 3D fixa, e clica em objetos físicos (terminal de computador, console de rádio, quadro de avisos/holotape, Pip-Boy) para abrir dossiês sobre o candidato. Recusa o portfólio-currículo-rolável padrão em favor de uma experiência point-and-click habitada.

OWN-WORLD: paleta "monitor fósforo" — fundo quase-preto (#05070a / #0a0f0a), verde Pip-Boy (#39FF14 / #1aff6e) como cor de interação dominante (estratégia Committed, carregada via luz/glow/emissive em vez de blocos de cor chapada), âmbar (#ffb000) como acento secundário de aviso/destaque pontual, metal enferrujado e concreto escuro como materiais de cena (sem texturas externas — geometria + cor/emissive, como no site de referência). Tipografia mono de terminal (Share Tech Mono / VT323) para toda a UI sobreposta; sem serifas, sem gradientes suaves, sem glassmorphism — tudo "fósforo + scanline".

STORY: Em segundos o visitante entende que está "logado" num terminal de vault. Explora livremente clicando nos objetos da sala: terminal = PROJETOS, console/rádio = EXPERIÊNCIA, quadro/holotape = SOBRE MIM, Pip-Boy = CONTATO + download do currículo. Sai sabendo que o candidato entrega sistemas reais em produção (ERP substituindo sistema legado, 90 usuários) e está migrando para segurança da informação.

FIRST VIEWPORT: Tela de boot estilo terminal RobCo/Vault-Tec (eco do "PRESSIONE QUALQUER TECLA" do site de referência, mas com linguagem de boot de vault e leve glitch de scanline), seguida da cena 3D do bunker em câmera fixa, levemente angulada, com hotspots rotulados flutuando sobre os objetos clicáveis.

FORM: mecânica de "quarto 3D navegável" do site de referência tadao.dev (Three.js + WebGL2, câmera fixa, raycasting em hotspots, overlay CRT com scanline/aberração cromática/vinheta via render-to-texture) — reaproveitada e recontextualizada para o universo Fallout/Vault-Tec. seed: none (unavailable) — mundo visual pinado explicitamente pelo usuário (tema Fallout + mecânica do site de referência confirmados em múltiplas rodadas de pergunta); o torneio concept-seed não foi executado porque não havia escolha de mundo em aberto a decidir.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
