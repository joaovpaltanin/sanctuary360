# Sanctuary360

Explore o Tabernáculo do deserto em 3D. MVP open-source em Next.js, Three.js e TypeScript para estudar a arquitetura, os móveis e o significado do santuário bíblico na perspectiva adventista do sétimo dia.

> **Rascunho em revisão.** O conteúdo ainda não passou por revisão teológica humana nem verificação editorial e de direitos de uso. Não foi aprovado para publicação pública. Veja [AGENTS.md](./AGENTS.md) para os critérios editoriais e técnicos.

## Demonstração

- `/` — Exploração 3D, tour de nove etapas e painel de informações.
- `/estudo` — Guia textual completo, acessível sem JavaScript.
- `/sobre` — Fontes, critérios e limites editoriais.

## Stack

- **Framework:** Next.js 16 + React 19 + TypeScript 5
- **3D:** Three.js + React Three Fiber + Drei
- **Estado:** Zustand
- **Estilo:** Tailwind CSS 4
- **Testes:** Vitest + Playwright

## Como rodar

Requisitos: Node.js 22.13+ ou 24 e npm.

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra http://127.0.0.1:3000. No Windows, use `npm.cmd` se o PowerShell bloquear `npm.ps1`; em outros sistemas, use `npm`.

Se encontrar a falha interna `edgesOut` do npm 11.3:

```powershell
npm.cmd exec --yes --package=npm@11.10.1 -- npm ci
```

## Comandos

| Comando | Função |
| --- | --- |
| `npm.cmd run dev` | Servidor de desenvolvimento |
| `npm.cmd run build` | Build de produção |
| `npm.cmd run start` | Servidor de produção |
| `npm.cmd test` | Testes unitários |
| `npm.cmd run test:e2e` | Testes de navegador (instale o Chromium com `npm.cmd exec -- playwright install chromium`) |
| `npm.cmd run lint` | ESLint |
| `npm.cmd run typecheck` | Verificação de tipos |

## Contribuir

Contribuições são bem-vindas, especialmente em:

- Revisão e aprimoramento do conteúdo bíblico e teológico.
- Acessibilidade, tradução e layout responsivo.
- Testes, performance 3D e documentação.

Antes de enviar mudanças significativas, leia [AGENTS.md](./AGENTS.md). Mantenha a separação entre descrição bíblica, reconstrução visual e interpretação teológica, e preserve o aviso de rascunho enquanto o projeto não for aprovado para publicação.

## Licença

- **Código:** licenciado sob [MIT](./LICENSE).
- **Conteúdo textual e guiado:** licenciado sob [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). As referências bíblicas permanecem de seus respectivos detentores de direitos.

O projeto é independente e não representa uma posição oficial de nenhuma instituição denominacional.
