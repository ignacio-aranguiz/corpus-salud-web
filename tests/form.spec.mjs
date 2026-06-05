import { test, expect } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────

const FORM = '/descubrimiento-v3.html';

async function start(page) {
  await page.goto(FORM);
  await page.waitForLoadState('networkidle');
  await page.click('button.btn-start');
  await page.waitForSelector('#step-1.active');
}

async function completeStep1(page) {
  await page.check('input[name="zona"][value="rodilla"]');
  await page.click('#btn-next');
  await page.waitForSelector('#step-2.active');
}

async function completeStep2(page) {
  await page.check('input[name="postergacion"][value="no_busque"]');
  await page.click('#btn-next');
  await page.waitForSelector('#step-3.active');
}

async function completeStep3(page, treatment) {
  await page.check(`input[name="termino"][value="${treatment}"]`);
  await page.click('#btn-next');
}

async function completeStep4(page) {
  await page.waitForSelector('#step-4.active');
  await page.check('input[name="en_casa"][value="a_veces"]');
  await page.click('#btn-next');
  await page.waitForSelector('#step-5.active');
}

async function navigateToStep6(page, { treatment, mejora = null }) {
  await start(page);
  await completeStep1(page);
  await completeStep2(page);
  await completeStep3(page, treatment);
  if (treatment !== 'no_empece') {
    await completeStep4(page);
  } else {
    await page.waitForSelector('#step-5.active');
  }
  if (treatment === 'no_empece' && mejora) {
    await page.check(`input[name="mejora"][value="${mejora}"]`);
  } else if (treatment !== 'no_empece') {
    await page.fill('#varita-normal', 'Más flexibilidad de horario');
  }
  await page.click('#btn-next');
  await page.waitForSelector('#step-6.active');
}

// ── Suite: branching de pasos ───────────────────────────────────────────────

test.describe('Branching de pasos', () => {

  test('noempece: step 4 se salta, va directo a step 5', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page, 'no_empece');
    await expect(page.locator('#step-5')).toHaveClass(/active/);
    await expect(page.locator('#step-4')).not.toHaveClass(/active/);
  });

  test('noempece: "Atrás" desde step 5 regresa a step 3, no step 4', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page, 'no_empece');
    await page.waitForSelector('#step-5.active');
    await page.click('#btn-prev');
    await expect(page.locator('#step-3')).toHaveClass(/active/);
    await expect(page.locator('#step-4')).not.toHaveClass(/active/);
  });

  test('no_aplica: steps 3 y 4 se saltan, va directo a step 5', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await page.check('input[name="postergacion"][value="no_aplica"]');
    await page.click('#btn-next');
    await expect(page.locator('#step-5')).toHaveClass(/active/);
    await expect(page.locator('#step-3')).not.toHaveClass(/active/);
    await expect(page.locator('#step-4')).not.toHaveClass(/active/);
  });

  test('no_aplica: "Atrás" desde step 5 regresa a step 2', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await page.check('input[name="postergacion"][value="no_aplica"]');
    await page.click('#btn-next');
    await page.waitForSelector('#step-5.active');
    await page.click('#btn-prev');
    await expect(page.locator('#step-2')).toHaveClass(/active/);
  });

  test('completó tratamiento: step 4 se muestra', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page, 'si');
    await expect(page.locator('#step-4')).toHaveClass(/active/);
  });

  test('dejó a medias: step 4 se muestra', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page, 'a_medias');
    await expect(page.locator('#step-4')).toHaveClass(/active/);
  });

});

// ── Suite: variante de step 5 ───────────────────────────────────────────────

test.describe('Variantes de step 5', () => {

  test('noempece: muestra "¿Qué hiciste para sentirte mejor?"', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page, 'no_empece');
    await page.waitForSelector('#step-5.active');
    await expect(page.locator('#step5-noempece')).toBeVisible();
    await expect(page.locator('#step5-normal')).not.toBeVisible();
    await expect(page.locator('#step5-noempece h2')).toContainText('¿Qué hiciste para sentirte mejor?');
  });

  test('completó tratamiento: muestra "Si pudieras cambiar una sola cosa..."', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await completeStep2(page);
    await completeStep3(page, 'si');
    await completeStep4(page);
    await expect(page.locator('#step5-normal')).toBeVisible();
    await expect(page.locator('#step5-noempece')).not.toBeVisible();
    await expect(page.locator('#step5-normal h2')).toContainText('Si pudieras cambiar una sola cosa');
  });

});

// ── Suite: variante de step 6 ───────────────────────────────────────────────

test.describe('Variantes de step 6', () => {

  test('noempece + nada: muestra "¿Qué te haría más fácil comenzar?"', async ({ page }) => {
    await navigateToStep6(page, { treatment: 'no_empece', mejora: 'nada' });
    await expect(page.locator('#step6-nada')).toBeVisible();
    await expect(page.locator('#step6-normal')).not.toBeVisible();
    await expect(page.locator('#step6-nada h2')).toContainText('¿Qué te haría más fácil comenzar?');
  });

  test('noempece + descanso: muestra "¿Qué te haría más fácil comenzar?"', async ({ page }) => {
    await navigateToStep6(page, { treatment: 'no_empece', mejora: 'descanso' });
    await expect(page.locator('#step6-nada')).toBeVisible();
    await expect(page.locator('#step6-normal')).not.toBeVisible();
  });

  test('noempece sin selección en step 5: muestra "¿Qué te haría más fácil comenzar?"', async ({ page }) => {
    await navigateToStep6(page, { treatment: 'no_empece', mejora: null });
    await expect(page.locator('#step6-nada')).toBeVisible();
    await expect(page.locator('#step6-normal')).not.toBeVisible();
  });

  test('no_aplica: muestra "¿Qué te haría más fácil comenzar?"', async ({ page }) => {
    const page2 = page;
    await start(page2);
    await completeStep1(page2);
    await page2.check('input[name="postergacion"][value="no_aplica"]');
    await page2.click('#btn-next');
    await page2.waitForSelector('#step-5.active');
    await page2.click('#btn-next');
    await page2.waitForSelector('#step-6.active');
    await expect(page2.locator('#step6-nada')).toBeVisible();
    await expect(page2.locator('#step6-normal')).not.toBeVisible();
  });

  test('completó tratamiento: muestra "¿Cómo te gustaría recuperarte?"', async ({ page }) => {
    await navigateToStep6(page, { treatment: 'si' });
    await expect(page.locator('#step6-normal')).toBeVisible();
    await expect(page.locator('#step6-nada')).not.toBeVisible();
    await expect(page.locator('#step6-normal h2')).toContainText('¿Cómo te gustaría recuperarte?');
  });

  test('dejó a medias: muestra "¿Cómo te gustaría recuperarte?"', async ({ page }) => {
    await navigateToStep6(page, { treatment: 'a_medias' });
    await expect(page.locator('#step6-normal')).toBeVisible();
    await expect(page.locator('#step6-nada')).not.toBeVisible();
  });

});

// ── Suite: validaciones ────────────────────────────────────────────────────

test.describe('Validaciones — no puede avanzar sin selección', () => {

  test('step 1: muestra error si no se seleccionó zona', async ({ page }) => {
    await start(page);
    await page.click('#btn-next');
    await expect(page.locator('#err-zona')).toBeVisible();
    await expect(page.locator('#step-1')).toHaveClass(/active/);
  });

  test('step 2: muestra error si no se seleccionó postergación', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await page.click('#btn-next');
    await expect(page.locator('#err-postergacion')).toBeVisible();
    await expect(page.locator('#step-2')).toHaveClass(/active/);
  });

  test('step 3: muestra error si no se seleccionó tratamiento', async ({ page }) => {
    await start(page);
    await completeStep1(page);
    await completeStep2(page);
    await page.click('#btn-next');
    await expect(page.locator('#err-termino')).toBeVisible();
    await expect(page.locator('#step-3')).toHaveClass(/active/);
  });

  test('step 6 normal: muestra error si no se seleccionó formato', async ({ page }) => {
    await navigateToStep6(page, { treatment: 'si' });
    await page.click('#btn-submit');
    await expect(page.locator('#err-formato')).toBeVisible();
  });

  test('step 6 nada: muestra error si no se seleccionó primer_paso', async ({ page }) => {
    await navigateToStep6(page, { treatment: 'no_empece', mejora: 'nada' });
    await page.click('#btn-submit');
    await expect(page.locator('#err-primer_paso')).toBeVisible();
  });

});
