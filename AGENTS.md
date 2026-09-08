# Orientações para agentes — Sanctuary360

## Estado e escopo

O repositório contém um MVP funcional em Next.js: exploração 3D esquemática do Tabernáculo, tour de nove etapas, painel de informações, camadas e guia textual independente de JavaScript. Consulte o README.md e inspecione o estado real antes de trabalhar.

O objetivo é uma plataforma educacional em português do Brasil sobre o Tabernáculo do deserto, com conteúdo bíblico na perspectiva adventista do sétimo dia. O conteúdo permanece em rascunho, sem revisão teológica humana concluída ou aprovação institucional.

RV/RA, contas, CMS, biblioteca extensa, primeira pessoa e rituais animados estão fora do MVP. Não implemente esses recursos sem solicitação. A publicação pública depende das revisões indicadas no README.

## Diretrizes editoriais obrigatórias

- Use a Bíblia como fonte primária e confira se cada referência sustenta a afirmação associada.
- Comece por Êxodo 25–40, Levítico 1–7 e 16, e Hebreus 8–10; use referências específicas para cada elemento.
- Distinga explicitamente descrição bíblica, reconstrução visual e interpretação teológica.
- Identifique a perspectiva adventista. Não apresente doutrinas confessionais como consenso de todas as tradições cristãs.
- Use a Crença Fundamental 24 como referência confessional para o ministério de Cristo no santuário celestial, consultando sua formulação oficial.
- Diferencie conexões explícitas do Novo Testamento de aplicações tipológicas. Não invente simbolismos, citações ou referências.
- Preserve a distinção entre o sacrifício de Cristo, oferecido uma vez por todas, e seu ministério sacerdotal.
- Trate 1844 e o juízo investigativo em explicações identificadas como adventistas e fundamentadas, não como fatos arquitetônicos.
- Atribua separadamente materiais denominacionais, estudos históricos e escritos de Ellen G. White. Não os rotule como texto bíblico.
- Verifique nomes hebraicos, traduções e transliterações antes de incluí-los. Omita dados não verificados em vez de adivinhar.
- Não reproduza uma tradução bíblica sem verificar seus direitos de uso. Enquanto isso, use referências e resumos autorais claramente identificados.
- Marque conteúdo não revisado como rascunho. Não alegue revisão teológica humana ou aprovação institucional sem que tenham ocorrido.
- A publicação pública depende de revisão teológica humana e verificação de direitos de uso.
- Preserve o aviso editorial nas páginas e a orientação `noindex, nofollow` enquanto o projeto não estiver aprovado para publicação. Essa orientação não é controle de acesso.

## Fidelidade da reconstrução

- Modele o Tabernáculo do deserto, sem importar características dos templos de Salomão ou Herodes como se fossem suas.
- Preserve medidas em côvados como dados primários. Centralize a convenção de conversão e informe que valores métricos são aproximados.
- Não fixe medidas métricas duplicadas no conteúdo; derive-as da medida original e da convenção adotada.
- Identifique dimensões não especificadas na Bíblia como aproximações. Não atribua medidas conjecturais à bacia como se fossem bíblicas.
- Registre fonte, grau de certeza e observações das escolhas de reconstrução.
- Não apresente a geometria terrestre como reprodução comprovada da arquitetura celestial.
- Efeitos de luz associados à presença divina são recursos ilustrativos e devem ser identificados como tais.
- O tour é didático. Explique as restrições históricas de acesso e não o apresente como um único ritual executado por qualquer adorador.
- Distribuição de pilares, suportes, pisos, coberturas, cores e espessuras estão simplificados. Não descreva o modelo como uma reprodução construtiva completa.

## Arquitetura técnica

- Next.js com App Router e TypeScript; React.
- Three.js com React Three Fiber e Drei para a cena.
- Tailwind CSS e CSS próprio; controles de interface nativos e acessíveis, sem biblioteca adicional de componentes.
- Zustand para seleção, tour, camadas e modo de visualização, sem transferir todo estado local para uma store global.
- Conteúdo TypeScript tipado; MDX apenas quando houver necessidade de artigos.
- Geometrias geradas em código; GLB/glTF poderão substituí-las posteriormente.
- Vitest para testes unitários e Playwright com Chromium para testes de navegador.

As versões diretas estão fixadas em package.json e a árvore está em package-lock.json. Verifique compatibilidade antes de adicionar dependências. Prefira versões estáveis publicadas há pelo menos sete dias; não use referências flutuantes como latest. Use o gerenciador de pacotes e mantenha um único lockfile coerente.

### Arquivos principais

- `src/content/sanctuary.ts`: IDs, textos, referências, avisos e sequência do tour.
- `src/lib/measurements.ts`: convenção de 0,4572 m por côvado, conversões e formatação.
- `src/lib/model-layout.ts`: coordenadas dos hotspots, enquadramentos de câmera e flags de interior.
- `src/lib/exploration-store.ts`: store criada por instância do explorador, sem compartilhamento global entre renderizações de servidor.
- `src/components/Explorer.tsx`: integração da navegação, cena, leitura e painel.
- `src/components/InfoPanel.tsx`: painel não modal, abas e conversão de medidas.
- `src/components/scene/SanctuaryScene.tsx`: Canvas, câmera, hotspots, detecção de WebGL e perda de contexto.
- `src/components/scene/SanctuaryModel.tsx`: geometrias e posicionamento dos objetos.
- `src/components/scene/SceneErrorBoundary.tsx`: tratamento de falhas de carregamento/renderização e acesso alternativo.
- `src/app/estudo/page.tsx`: conteúdo completo pré-renderizado, utilizável sem JavaScript.
- `src/app/sobre/page.tsx`: critérios e limites editoriais.
- `tests/explorer.spec.ts`: testes de navegador.

### Separação de responsabilidades

- Mantenha textos, fontes e metadados fora dos componentes de renderização 3D.
- Relacione conteúdo, objetos e etapas do tour por identificadores estáveis e tipados.
- Separe componentes da cena, controles de câmera, interface e lógica do tour.
- Centralize transições do tour e arbitragem dos controles de câmera para evitar conflito com a exploração livre.
- Mantenha no cliente apenas os trechos que precisam de APIs do navegador ou WebGL. Preserve conteúdo textual acessível sem depender do canvas.
- Não introduza banco de dados, autenticação ou serviços externos sem necessidade aprovada.
- Uma unidade da cena é um côvado. O pátio ocupa x de -25 a 25 e z de -50 a 50; a entrada leste está em z=50. A tenda fica entre z=-35 e -5, com o véu em z=-25. O eixo x positivo corresponde ao norte.
- As posições em model-layout são marcadores elevados, não a origem física dos móveis. Ao mudar geometrias, mantenha câmeras e hotspots coerentes.
- Selecionar um móvel interno abre paredes e coberturas. A seleção do véu mostra as paredes e o próprio véu, mantendo a cobertura oculta. A seleção livre encerra o tour.
- O tour é manual; não avança com temporizadores. Interação de órbita interrompe a transição de câmera sem avançar a etapa.

## Experiência e acessibilidade

- Use português do Brasil na interface e na documentação voltada ao usuário.
- Ofereça uma lista textual dos elementos com acesso ao mesmo conteúdo dos hotspots.
- Garanta operação por teclado, nomes acessíveis, foco visível e gerenciamento de foco apropriado ao painel escolhido.
- O painel é não modal: não prenda o foco. Escape fecha as informações e devolve o foco à lista; setas, Home e End navegam pelas abas.
- Não dependa exclusivamente de cor, hover ou gestos complexos.
- Respeite prefers-reduced-motion nas transições de câmera e interface.
- Disponibilize estados de carregamento, erro e alternativa sem renderização 3D.
- Planeje responsividade e interação por toque desde o protótipo.
- Evite abas de mídia vazias, botões sem função e recursos anunciados como prontos quando ainda não existem.

## Desempenho 3D

- Priorize clareza didática e baixo custo de renderização em vez de fotorrealismo.
- Reutilize geometrias e materiais quando possível. Evite criar objetos desnecessários a cada frame.
- Não atualize estado React continuamente dentro do loop de animação.
- Limite sombras, resolução de renderização e complexidade para dispositivos móveis.
- Faça carregamento sob demanda de recursos pesados e descarte recursos quando apropriado.
- Avalie compressão e níveis de detalhe quando houver modelos externos; não adicione complexidade prematuramente.
- O modelo compartilha materiais e geometrias em nível de módulo e usa dispose={null}. Não descarte um recurso compartilhado enquanto outra instância ainda o utiliza.
- A cena usa frameloop="demand" e limita o DPR a 1,5. A câmera invalida frames durante transições, sem setState no loop.
- `SceneMotion.tsx` mantém um relógio por instância para todos os efeitos ambientais. Solicita frames em até 30 Hz somente com animações habilitadas, aba visível e canvas na tela. Câmera/interação podem solicitar frames adicionais. Preserve pausa manual, movimento reduzido e desmontagem no modo leitura.
- `DesertEnvironment.tsx` e `environment-layout.ts` separam renderização de céu/terreno/vegetação/aves e posições determinísticas. O pátio e sua margem ficam planos. `surface-textures.ts` mantém cinco DataTextures procedurais compartilhadas de 128×128; não modifique nem descarte esses recursos nos consumidores.
- Texturas e animações são controles independentes, locais ao Explorer. Sem texturas, preserve materiais lisos e destaque de seleção. Qualidade manual: Econômica (DPR 1, sem sombras/aves), Equilibrada (1,25; sombras 1024) e Detalhada (1,5; sombras 2048). Preferências sobrevivem à troca de modo, não ao reload.
- A vista HORIZON permite observar céu e sol; seu botão encerra tour/seleção. A seleção de elementos continua priorizando model-layout. Luz e disco solar usam SUN_POSITION; mantenha coerência. O vento nos tecidos é um balanço rígido discreto em torno da suspensão superior, não simulação física. Paisagem e efeitos continuam explicitamente ilustrativos.
- `RendererMonitor` instala o listener de perda de contexto em layout effect e alinha o viewport ao tamanho inteiro do drawing buffer antes de renderizar. Isso evita divergência de um pixel ao restaurar layouts com larguras CSS fracionárias; preserve o teste de viewport e comparação de pixels.
- A criação do renderizador pode falhar de forma assíncrona. Preserve a verificação prévia de WebGL2, o tratamento de perda de contexto e seus testes; um ErrorBoundary isolado não cobre a falha inicial de contexto observada.

## Ambiente e comandos

Node.js suportado pelo projeto: 22.13+ ou 24. Desenvolvimento e verificações foram executados no Windows com Node.js 24.14.0.

No PowerShell, use `npm.cmd` em vez de `npm` quando o atalho npm.ps1 for bloqueado. Não altere ExecutionPolicy. O npm 11.3 apresentou falha interna edgesOut ao adicionar dependências de desenvolvimento; a instalação funcionou com execução pontual do npm 11.10.1, sem mudança global.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run start
npm.cmd exec -- playwright install chromium
npm.cmd run test:e2e
```

O README descreve a alternativa com npm 11.10.1. A coerência do lockfile também foi verificada com `npm.cmd ci --dry-run`; isso não equivale a uma reinstalação completa.

- O desenvolvimento usa 127.0.0.1:3000. Para testar produção em paralelo, use `npm.cmd run start -- --port 3001` após o build.
- O Playwright inicia ou reutiliza o servidor local em 3000. Os testes usam Chromium com renderização por software, não uma GPU de celular real.
- `npm.cmd run test:watch` executa Vitest em observação.
- `npm.cmd audit --omit=dev` verifica as dependências de produção.

## Verificação

Na implementação inicial passaram 96 testes unitários, 7 testes de navegador, lint, tipos e build. Os testes incluem limites de câmera em telas estreitas, visibilidade do véu e recuperação do foco após falhas gráficas. Auditoria de produção não reportou vulnerabilidades na execução. Esses resultados não substituem novas verificações após alterações.

Após as melhorias ambientais, passaram 131 testes unitários, 12 testes de navegador, lint, tipos e build de produção. Os novos testes medem chamadas reais de desenho WebGL em pausa/movimento reduzido/fora da tela, simulam a visibilidade oculta do documento, comparam pixels ao alternar texturas e verificam retorno do horizonte nas três qualidades. A comparação ignora variação de um nível por canal e tolera até quatro pixels residuais na restauração de materiais; não substitui revisão visual humana. O aviso de depreciação de THREE.Clock da integração existente permanece.

1. Inspecione scripts e configuração antes de executar comandos.
2. Atualize aqui e no README os comandos reais quando houver mudança.
3. Teste conversões de medidas, integridade dos identificadores, referências entre tour e elementos e transições de estado.
4. Verifique seleção pelo canvas e pela lista, abertura e fechamento do painel, navegação do tour e controle de camadas.
5. Teste teclado, movimento reduzido, layout móvel, falha de WebGL e perda de contexto, além do guia sem JavaScript.
6. Execute as verificações pertinentes à alteração, incluindo build de produção quando houver mudança na aplicação.
7. Informe o que passou, falhou ou não pôde ser validado. Testes de software não substituem revisão teológica.

Ainda estão pendentes revisão teológica humana, avaliação em dispositivos físicos e outros navegadores, avaliação com leitores de tela, revisão visual de contraste/tamanho de texto e verificação editorial e de direitos de uso. Não declare essas etapas concluídas sem executá-las.

Para alterações somente de documentação, confira coerência com o estado real, links locais e formatação; use git diff --check quando disponível. Arquivos novos não rastreados não aparecem no diff padrão: leia-os diretamente também.

## Convenções de trabalho

- Leia os arquivos afetados e siga os padrões existentes antes de editar.
- Faça mudanças pequenas e relacionadas ao pedido. Não implemente recursos futuros apenas porque constam do roadmap.
- Prefira editar arquivos existentes; crie novos arquivos quando necessários à tarefa.
- Não adicione nem remova comentários de código sem solicitação.
- Não inclua emojis sem solicitação.
- Não registre segredos, tokens ou dados pessoais em código, documentação ou logs.
- Não altere políticas de segurança para contornar falhas de instalação ou build.
- Não apague arquivos existentes nem execute operações destrutivas sem confirmação específica.
- Não faça commit ou push sem solicitação.
- Para novas configurações específicas do Devin, use .devin/ e consulte a documentação da ferramenta. Não crie configurações em diretórios de outras ferramentas sem pedido explícito.
- Atualize esta documentação quando decisões aprovadas ou comandos verificados alterarem as orientações persistentes do projeto. Diferencie sempre planejado, implementado e validado.
