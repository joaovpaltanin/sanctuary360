# Sanctuary360

Plataforma web educacional para explorar o Tabernáculo bíblico em 3D e estudar seus elementos, funções e significado na perspectiva adventista do sétimo dia.

## Estado do projeto

**MVP implementado, ainda não aprovado para publicação pública.** A aplicação inclui exploração 3D esquemática, tour guiado, painéis de estudo e alternativa textual. O conteúdo é rascunho, pendente de revisão teológica humana e de verificação editorial e de direitos de uso.

O projeto é independente e não alega vínculo oficial ou aprovação institucional. As páginas usam `noindex, nofollow` enquanto o conteúdo está em revisão; isso não substitui controle de acesso nem torna uma implantação privada.

## Executar localmente

Requisitos: Node.js 22.13+ ou Node.js 24 e npm. O ambiente de implementação utiliza Node.js 24.14.0. Não são necessários banco de dados, variáveis de ambiente, modelos externos ou chaves de API.

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra **http://127.0.0.1:3000**. No Windows, use `npm.cmd` se a política do PowerShell bloquear `npm.ps1`; não é necessário alterar a política de segurança. Em outros sistemas, use `npm` no lugar de `npm.cmd`.

Foi encontrada uma falha interna `Cannot read properties of null (reading 'edgesOut')` no npm 11.3 ao adicionar dependências de desenvolvimento. A instalação foi concluída usando npm 11.10.1 por execução pontual, sem atualizar o npm global. Se encontrar essa falha:

```powershell
npm.cmd exec --yes --package=npm@11.10.1 -- npm ci
```

### Comandos

| Comando | Função |
| --- | --- |
| `npm.cmd run dev` | Servidor de desenvolvimento em 127.0.0.1:3000 |
| `npm.cmd test` | Testes unitários com Vitest |
| `npm.cmd run test:watch` | Testes em modo de observação |
| `npm.cmd run lint` | ESLint |
| `npm.cmd run typecheck` | Geração de tipos de rotas e verificação TypeScript |
| `npm.cmd run build` | Build de produção |
| `npm.cmd run start` | Servidor de produção; requer build anterior |
| `npm.cmd run test:e2e` | Testes de navegador com Playwright |

Para os testes de navegador, instale o Chromium uma vez:

```powershell
npm.cmd exec -- playwright install chromium
npm.cmd run test:e2e
```

O Playwright inicia o servidor de desenvolvimento automaticamente ou reutiliza o servidor local na porta 3000. Os testes usam renderização por software no Chromium; não substituem avaliação em GPU real ou celular físico.

## Funcionalidades implementadas

- Modelo 3D do pátio, tenda, compartimentos e móveis principais, gerado em código.
- Exploração livre por rotação, aproximação e seleção por objeto, marcador ou lista.
- Tour de **nove etapas**, com avançar, voltar, reiniciar, sair e concluir.
- Transições de câmera que respeitam a preferência por movimento reduzido; a interação manual interrompe a transição atual.
- Camadas para mostrar ou ocultar coberturas e paredes, incluindo o véu.
- Enquadramento dos elementos internos com abertura automática das camadas necessárias. Ao estudar o véu, ele é mostrado; ao selecionar a arca, o interior volta a ficar aberto.
- Painel não modal com abas, navegação por teclado, foco no título e fechamento por Escape.
- Medidas documentadas em côvados, com conversões aproximadas para metros e pés.
- Modo leitura e guia completo que não depende de JavaScript ou WebGL.
- Estados de carregamento e indisponibilidade do 3D, com acesso ao texto. Perda de contexto gráfico migra para leitura preservando a seleção.
- Interface em português do Brasil, com layout responsivo.

### Páginas

| Rota | Conteúdo |
| --- | --- |
| `/` | Exploração 3D, tour e leitura interativa |
| `/estudo` | Todos os textos, referências e incertezas; acessível sem JavaScript e com estilo de impressão |
| `/sobre` | Identidade do projeto, fontes, critérios e limites editoriais |

### Percurso didático

1. Entrada do pátio.
2. Altar do holocausto.
3. Bacia de bronze.
4. Mesa dos pães.
5. Candelabro.
6. Altar de incenso.
7. Véu.
8. Arca da aliança e propiciatório.
9. Cristo e o santuário: síntese fundamentada em Hebreus e interpretação adventista identificada.

Esse percurso é uma visita didática, não uma reconstituição de um ritual único nem uma indicação de que qualquer israelita podia acessar todos os compartimentos. O tour avança apenas por ação do visitante, sem reprodução automática.

### Painel de informações

| Aba | Conteúdo |
| --- | --- |
| Visão geral | Descrição, função, materiais e medidas documentadas |
| Na Bíblia | Referências contextualizadas e resumos autorais, não transcrições de uma tradução |
| Teologia | Interpretação adventista, conexões explícitas e aplicações tipológicas identificadas |
| Modelo | Escolhas visuais, aproximações e limites da reconstrução |

Nomes hebraicos e transliterações só serão adicionados após verificação. Não há mídia fictícia ou abas de conteúdo vazio.

## Compromisso bíblico e editorial

A Bíblia é a fonte primária. As bases iniciais incluem Êxodo 25–40, Levítico 1–7 e 16, e Hebreus 8–10. Cada elemento possui suas referências específicas.

A [Crença Fundamental 24 — O ministério de Cristo no santuário celestial](https://www.adventist.org/beliefs/) é a referência confessional. Materiais denominacionais, estudos históricos e escritos de Ellen G. White, se adicionados, deverão ter atribuição própria e não serão apresentados como citações bíblicas.

Princípios editoriais:

- Separar descrição bíblica, inferência de reconstrução e interpretação teológica.
- Distinguir conexões explícitas do Novo Testamento de aplicações tipológicas.
- Não atribuir significado espiritual a cada detalhe sem sustentação.
- Preservar a distinção entre o sacrifício de Cristo, oferecido uma vez por todas, e seu ministério sacerdotal.
- Apresentar 1844 e o juízo investigativo como doutrinas adventistas, com indicação de sua argumentação e fonte, sem pressupor consenso entre tradições cristãs.
- Não tratar a geometria terrestre como reprodução comprovada da arquitetura celestial.
- Não representar Deus como um objeto físico na cena.
- Exigir revisão teológica humana antes da publicação pública.

### Medidas e reconstrução

A reconstrução representa o **Tabernáculo do deserto**, sem misturar sua arquitetura com a dos templos de Salomão ou Herodes.

Uma unidade 3D corresponde a um côvado. As medidas bíblicas são preservadas; a conversão usa **1 côvado = 0,4572 m** como convenção didática, não como equivalência histórica universal. Metros e pés são derivados, não armazenados como medidas independentes.

O pátio segue 100 × 50 côvados e cortinas de altura 5 (Êxodo 27:9–18). A tenda de 30 × 10 × 10 e a divisão interna são uma reconstrução convencional a partir de Êxodo 26. Posição exata, distribuição dos pilares, espessuras, tecidos, pisos destacados e coberturas são simplificados. O modelo não reproduz todos os detalhes construtivos.

Dimensões não informadas, como as da bacia e do candelabro, não são cadastradas como dados bíblicos. Sua aparência e escala são identificadas como aproximadas. A apresentação é didática e esquemática, não historicamente comprovada.

### Direitos de uso

Os textos são resumos autorais. A tradução bíblica para eventuais citações literais ainda será escolhida; reprodução dependerá de licença aplicável, autorização ou domínio público verificado.

Não há imagens, fontes remotas ou modelos de terceiros nesta versão. Geometrias e ícones são gerados localmente. As bibliotecas possuem suas próprias licenças, que devem ser respeitadas. A licença do código do projeto ainda não foi definida.

## Arquitetura

- **Next.js + React + TypeScript:** rotas e páginas textuais pré-renderizadas.
- **Three.js + React Three Fiber + Drei:** cena carregada sob demanda no cliente, geometrias compartilhadas, renderização sob demanda e resolução limitada.
- **Tailwind CSS + CSS próprio:** interface e layouts responsivos, sem biblioteca adicional de componentes.
- **Zustand:** store por instância do explorador para seleção, tour, camadas e modo de visualização.
- **Conteúdo TypeScript tipado:** identificadores estáveis conectam textos, objetos e etapas do tour.
- **Vitest + Playwright:** testes unitários e de navegador.

As versões diretas estão fixadas no `package.json`; o `package-lock.json` registra a árvore instalada. MDX, Blender/GLB, banco de dados e CMS não fazem parte da implementação atual.

### Organização

```text
src/
  app/                 Rotas, metadados, ícone e estilos globais
  components/          Interface, painel e navegação
    scene/             Modelo, câmera, hotspots e tratamento de falhas
  content/             Dados bíblicos e editoriais e seus testes
  lib/                 Medidas, layout espacial, estado e testes
tests/                 Fluxos de navegador
```

## Verificação e pendências

Verificações executadas durante a implementação:

- 96 testes unitários: conteúdo, IDs, referências, medidas, layout, limites de câmera, visibilidade dos marcadores e transições do tour.
- 7 testes de navegador: hotspots, painel, teclado nas abas, camadas/tour, visibilidade do véu, leitura sem JavaScript, WebGL indisponível, perda de contexto, recuperação do foco e viewport móvel com movimento reduzido.
- ESLint sem erros ou avisos e TypeScript sem erros.
- Build de produção concluído.
- Auditoria das dependências de produção sem vulnerabilidades reportadas no momento da execução.

Ainda necessários antes de uma publicação pública:

- Revisão teológica humana, incluindo as aplicações tipológicas e a síntese confessional.
- Avaliação visual e de interação em celulares físicos, diferentes GPUs e navegadores além do Chromium.
- Avaliação de acessibilidade com leitores de tela e revisão de contraste e tamanho de texto.
- Verificação editorial e de direitos de uso; definição da licença do projeto.

Testes automatizados não certificam fidelidade teológica, exatidão histórica ou conformidade integral de acessibilidade.

## Fora do escopo inicial

RV/RA, caminhada em primeira pessoa e colisões, personagens, rituais animados, biblioteca extensa, glossário completo, contas de usuário, CMS e fotorrealismo permanecem para etapas futuras.

Consulte [AGENTS.md](./AGENTS.md) para as orientações de implementação e manutenção.
