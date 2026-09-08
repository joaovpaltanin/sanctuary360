import { expect, test, type Page } from "@playwright/test";

const elementButton = (id: string) => `[data-element-id="${id}"]`;
type GpuTestWindow = Window & { __testDrawCalls: number };

function collectRenderErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function instrumentDrawCalls(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as GpuTestWindow;
    target.__testDrawCalls = 0;
    const prototype = WebGL2RenderingContext.prototype;
    for (const method of ["drawElements", "drawArrays", "drawElementsInstanced", "drawArraysInstanced"] as const) {
      const original = prototype[method];
      Object.defineProperty(prototype, method, {
        configurable: true,
        writable: true,
        value: function (this: WebGL2RenderingContext, ...args: number[]) {
          target.__testDrawCalls += 1;
          return Reflect.apply(original, this, args);
        },
      });
    }
  });
}

const drawCalls = (page: Page) => page.evaluate(() => (window as unknown as GpuTestWindow).__testDrawCalls);

async function sceneScreenshot(page: Page) {
  await page.getByRole("combobox", { name: "Qualidade gráfica" }).focus();
  await page.mouse.move(0, 0);
  const canvas = page.locator("canvas");
  const screenshot = await canvas.screenshot();
  const dimensions = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext("webgl2")!;
    return { viewport: Array.from(gl.getParameter(gl.VIEWPORT)), buffer: [0, 0, element.width, element.height] };
  });
  expect(dimensions.viewport).toEqual(dimensions.buffer);
  return screenshot;
}

async function compareScenePixels(page: Page, before: Buffer, after: Buffer) {
  return page.evaluate(async ({ a, b }) => {
    const decode = async (url: string) => {
      const image = await createImageBitmap(await (await fetch(url)).blob());
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, image.width, image.height);
      image.close();
      return data;
    };
    const left = await decode(a);
    const right = await decode(b);
    if (left.width !== right.width || left.height !== right.height) throw new Error("As capturas devem ter as mesmas dimensões.");
    let different = 0;
    let maxDifference = 0;
    const bounds = [left.width, left.height, 0, 0];
    for (let i = 0; i < left.data.length; i += 4) {
      const difference = Math.max(...[0, 1, 2, 3].map((channel) => Math.abs(left.data[i + channel] - right.data[i + channel])));
      if (difference > 1) {
        different++;
        maxDifference = Math.max(maxDifference, difference);
        const x = (i / 4) % left.width;
        const y = Math.floor(i / 4 / left.width);
        bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y);
        bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
      }
    }
    return { before: [left.width, left.height], after: [right.width, right.height], different, maxDifference, bounds };
  }, { a: `data:image/png;base64,${before.toString("base64")}`, b: `data:image/png;base64,${after.toString("base64")}` });
}

async function expectDrawsStopped(page: Page) {
  let previous = -1;
  let stableSince = Date.now();
  await expect.poll(async () => {
    const current = await drawCalls(page);
    if (current !== previous) stableSince = Date.now();
    previous = current;
    return current > 0 && Date.now() - stableSince >= 1000;
  }, { message: "WebGL draw calls settle and remain unchanged for one second", timeout: 12000, intervals: [200] }).toBe(true);
}

async function expectDrawsRunning(page: Page) {
  let previous = await drawCalls(page);
  let advancingSamples = 0;
  await expect.poll(async () => {
    const current = await drawCalls(page);
    advancingSamples = current > previous ? advancingSamples + 1 : 0;
    previous = current;
    return advancingSamples;
  }, { message: "WebGL draws continue across consecutive samples", timeout: 12000, intervals: [200] }).toBeGreaterThanOrEqual(3);
}

test("GPU interrompe desenhos em pausa, movimento reduzido, fora da tela e aba oculta", async ({ page }) => {
  test.setTimeout(60000);
  const errors = collectRenderErrors(page);
  await instrumentDrawCalls(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = page.locator("canvas");
  const animations = page.getByRole("button", { name: "Animações do ambiente", exact: true });
  await expect(canvas).toBeVisible();
  await expectDrawsRunning(page);
  await animations.click();
  await expect(animations).toHaveAttribute("aria-pressed", "false");
  await expectDrawsStopped(page);
  await animations.click();
  await expectDrawsRunning(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(animations).toBeDisabled();
  await expectDrawsStopped(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(animations).toHaveAttribute("aria-pressed", "true");
  await expectDrawsRunning(page);
  await canvas.evaluate((element) => { element.style.transform = "translateX(-200vw)"; });
  await expect(canvas).not.toBeInViewport();
  await expectDrawsStopped(page);
  await canvas.evaluate((element) => { element.style.removeProperty("transform"); });
  await expect(canvas).toBeInViewport();
  await expectDrawsRunning(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expectDrawsStopped(page);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "visibilityState");
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expectDrawsRunning(page);
  expect(errors).toEqual([]);
});

test("texturas alteram os pixels e restauram a mesma cena pausada", async ({ page }) => {
  test.setTimeout(60000);
  const errors = collectRenderErrors(page);
  await instrumentDrawCalls(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator("canvas");
  const textures = page.getByRole("button", { name: "Texturas", exact: true });
  await expect(canvas).toBeVisible();
  await expect(textures).toHaveAccessibleDescription("Materiais com texturas");
  await expectDrawsStopped(page);
  const textured = await sceneScreenshot(page);
  const beforePlain = await drawCalls(page);
  await textures.click();
  await expect(textures).toHaveAttribute("aria-pressed", "false");
  await expect(textures).toHaveAccessibleDescription("Cores lisas · sem texturas");
  await expect(page.getByText("Cores lisas · sem texturas", { exact: true })).toBeVisible();
  await expect.poll(() => drawCalls(page)).toBeGreaterThan(beforePlain);
  await expectDrawsStopped(page);
  const plain = await sceneScreenshot(page);
  expect((await compareScenePixels(page, textured, plain)).different).toBeGreaterThan(1000);
  const beforeRestore = await drawCalls(page);
  await textures.click();
  await expect(textures).toHaveAttribute("aria-pressed", "true");
  await expect(textures).toHaveAccessibleDescription("Materiais com texturas");
  await expect(page.getByText("Materiais com texturas", { exact: true })).toBeVisible();
  await expect.poll(() => drawCalls(page)).toBeGreaterThan(beforeRestore);
  await expectDrawsStopped(page);
  const difference = await compareScenePixels(page, textured, await sceneScreenshot(page));
  expect(difference.different).toBeLessThanOrEqual(4);
  expect(errors).toEqual([]);
});

test("horizonte encerra seleção e tour e volta à vista geral em todas as qualidades", async ({ page }) => {
  test.setTimeout(60000);
  const errors = collectRenderErrors(page);
  await instrumentDrawCalls(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  for (const quality of ["low", "medium", "high"]) {
    await page.getByRole("combobox", { name: "Qualidade gráfica" }).selectOption(quality);
    await expectDrawsStopped(page);
    const overview = await sceneScreenshot(page);
    await page.getByRole("button", { name: "Iniciar tour guiado", exact: true }).click();
    await expect(page.getByRole("progressbar", { name: "Progresso do tour" })).toBeVisible();
    await expect(page.locator('[data-element-id][aria-current="step"]')).toHaveCount(1);
    await page.getByRole("button", { name: "Ver horizonte", exact: true }).click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page.locator('[data-element-id][aria-current="step"]')).toHaveCount(0);
    await expect(page.getByRole("progressbar", { name: "Progresso do tour" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Iniciar tour guiado", exact: true })).toBeVisible();
    await expectDrawsStopped(page);
    expect((await compareScenePixels(page, overview, await sceneScreenshot(page))).different).toBeGreaterThan(1000);
    await page.getByRole("button", { name: "Voltar à vista geral", exact: true }).click();
    await expectDrawsStopped(page);
    const difference = await compareScenePixels(page, overview, await sceneScreenshot(page));
    expect(difference).toMatchObject({ different: 0 });
    expect(errors).toEqual([]);
  }
});

test("texturas podem ser desligadas sem perder seleção, camadas ou preferências", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const textures = page.getByRole("button", { name: "Texturas", exact: true });
  await expect(textures).toHaveAttribute("aria-pressed", "true");
  await page.locator(elementButton("ark")).click();
  await textures.click();
  await expect(textures).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("Cores lisas · sem texturas", { exact: true })).toBeVisible();
  await expect(page.locator(elementButton("ark"))).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("button", { name: "Paredes e véu", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("combobox", { name: "Qualidade gráfica" }).selectOption("low");
  await page.getByRole("button", { name: "Modo leitura", exact: true }).click();
  await page.getByRole("button", { name: "Modelo 3D", exact: true }).click();
  await expect(textures).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("combobox", { name: "Qualidade gráfica" })).toHaveValue("low");
  await expect(page.locator("canvas")).toBeVisible();
  await textures.click();
  await expect(textures).toHaveAttribute("aria-pressed", "true");
});

test("animações respeitam movimento reduzido e pausa manual independente de texturas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const animations = page.getByRole("button", { name: "Animações do ambiente", exact: true });
  await expect(animations).toHaveAttribute("aria-pressed", "false");
  await expect(animations).toBeDisabled();
  await expect(page.getByText("Movimento reduzido: ambiente estático.", { exact: true })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(animations).toBeEnabled();
  await expect(animations).toHaveAttribute("aria-pressed", "true");
  await animations.click();
  await expect(animations).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Texturas", exact: true }).click();
  await expect(animations).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[data-hotspot="altar"]')).toBeVisible();
});

test("carrega a cena e seleciona o altar por hotspot", async ({ page }, testInfo) => {
  const errors = collectRenderErrors(page);
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
  await expect(page.locator('[data-hotspot="ark"]')).toBeVisible();
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
