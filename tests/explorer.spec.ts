import { expect, test } from "@playwright/test";

const elementButton = (id: string) => `[data-element-id="${id}"]`;

test("carrega a cena e seleciona o altar por hotspot", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Um espaço sagrado");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator('[data-hotspot="altar"]')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("overview.png"), fullPage: true });
  await page.locator('[data-hotspot="altar"]').click();
  await expect(page.getByRole("heading", { name: "Altar do holocausto", exact: true })).toBeFocused();
  await expect(page.locator(elementButton("altar"))).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("tabpanel")).toContainText("Madeira de acácia");
  await page.getByRole("combobox", { name: "Unidade das dimensões" }).selectOption("meters");
  await expect(page.getByRole("tabpanel")).toContainText("≈ 2,29 m");
  await page.getByRole("tab", { name: "Na Bíblia" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Êxodo 27:1–8");
  await expect(page.getByRole("tabpanel")).toContainText("Resumo autoral");
  await page.getByRole("tab", { name: "Na Bíblia" }).press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Teologia", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("PERSPECTIVA ADVENTISTA");
  await page.getByRole("tab", { name: "Teologia", exact: true }).press("Escape");
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await expect(page.locator(elementButton("altar"))).toBeFocused();
  expect(errors).toEqual([]);
});

test("tour, camadas e seleção livre permanecem sincronizados", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Coberturas", exact: true }).click();
  await page.getByRole("button", { name: "Paredes e véu", exact: true }).click();
  await page.getByRole("button", { name: "Iniciar tour guiado" }).click();
  await expect(page.getByRole("button", { name: "Etapa anterior" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Entrada do pátio", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByRole("heading", { name: "Altar do holocausto", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Etapa anterior" }).click();
  await expect(page.getByRole("heading", { name: "Entrada do pátio", exact: true })).toBeVisible();
  for (let step = 0; step < 3; step++) await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByRole("heading", { name: "Mesa dos pães", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Coberturas", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Paredes e véu", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Modo leitura", exact: true }).click();
  for (let step = 0; step < 5; step++) await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByRole("heading", { name: "Cristo e o santuário", exact: true, level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Concluir tour" }).click();
  await expect(page.getByRole("button", { name: "Próxima etapa" })).toHaveCount(0);
  await page.locator(elementButton("basin")).click();
  await expect(page.getByRole("tabpanel")).toContainText("não informam medidas");
  await expect(page.getByRole("combobox")).toHaveCount(0);
});

test("guia é legível sem JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/estudo");
  await expect(page.locator("article")).toHaveCount(9);
  await expect(page.getByRole("heading", { name: "Cristo e o santuário", exact: true })).toBeVisible();
  await expect(page.locator("#ark")).toContainText("Levítico 16");
  await expect(page.getByText("Rascunho para revisão teológica humana", { exact: false })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await context.close();
});

test("indisponibilidade do WebGL oferece acesso ao conteúdo", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/");
  await page.getByRole("button", { name: "Abrir modo leitura", exact: true }).click();
  await expect(page.getByRole("button", { name: "Modo leitura", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Ler sobre Arca da aliança", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ler sobre Arca da aliança", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("cofre de acácia");
  await context.close();
});

test("perda de contexto migra para leitura sem perder a seleção", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.locator(elementButton("ark")).click();
  await page.locator("canvas").evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByRole("button", { name: "Modo leitura", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Modo leitura", exact: true })).toBeFocused();
  await expect(page.getByRole("heading", { name: "Arca da aliança", exact: true, level: 2 })).toBeVisible();
});

test("o marcador do véu acompanha sua camada e a seleção revela a arca", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-hotspot="altar"]')).toBeVisible();
  await expect(page.locator('[data-hotspot="veil"]')).toHaveCount(0);
  await page.locator(elementButton("veil")).click();
  await expect(page.getByRole("button", { name: "Paredes e véu", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-hotspot="veil"]')).toBeVisible();
  await page.getByRole("button", { name: "Paredes e véu", exact: true }).click();
  await expect(page.locator('[data-hotspot="veil"]')).toHaveCount(0);
  await page.locator(elementButton("ark")).click();
  await expect(page.locator('[data-hotspot="ark"]')).toBeVisible();
});

test("celular e movimento reduzido mantêm navegação sem overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Iniciar tour guiado" }).click();
  await page.getByRole("button", { name: "Próxima etapa" }).click();
  await expect(page.getByRole("heading", { name: "Altar do holocausto", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Fechar informações" }).click();
  await page.getByRole("link", { name: "Guia de estudo", exact: true }).click();
  await expect(page.locator("article")).toHaveCount(9);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
