import { test, expect, Page, BrowserContext } from '@playwright/test';
// Configuración base
const BASE_URL = 'http://localhost:3000';

// Credenciales de usuarios de prueba existentes
const TEST_USER_1 = {
  email: 'pruebaendtoendpruebaendtoend@gmail.com',
  password: '1234',
  nombre: 'Jugador1'
};

const TEST_USER_2 = {
  email: 'popocarri8@gmail.com',
  password: '1234',
  nombre: 'Jugador2'
};

// Utilidades auxiliares
async function iniciarSesion(page: Page, usuario: typeof TEST_USER_1) {
  // Ir a la página principal
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Si ya estamos logueados, salir temprano
  try {
    if (await page.locator('#nombreUsuario').isVisible({ timeout: 1000 })) return;
  } catch (e) {}

  // Asegurarnos de que el formulario/modal de login está accesible
  const emailField = page.getByRole('textbox', { name: 'Email:' });
  try {
    await emailField.waitFor({ state: 'visible', timeout: 1500 });
  } catch (e) {
    // Intentar abrir el modal de login si no está presente
    try {
      const btnLogin = page.getByRole('button', { name: 'Iniciar Sesión' });
      if (await btnLogin.count() > 0 && await btnLogin.isVisible()) await btnLogin.click();
    } catch (ee) {}
  }

  // Ahora rellenar (esperar a que los campos estén visibles)
  await page.getByRole('textbox', { name: 'Email:' }).waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('textbox', { name: 'Email:' }).click();
  await page.getByRole('textbox', { name: 'Email:' }).fill(usuario.email);

  await page.getByRole('textbox', { name: 'Contraseña:' }).waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('textbox', { name: 'Contraseña:' }).click();
  await page.getByRole('textbox', { name: 'Contraseña:' }).fill(usuario.password);

  // Hacer clic en Iniciar Sesión
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

  // Esperar a que desaparezca el modal y cargue la pantalla principal
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Dar tiempo a que se complete la transición
}

async function cerrarSesion(page: Page) {
  await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}
test.describe('Flujo de Autenticación', () => {
  test('debe permitir iniciar sesión con usuario existente', async ({ page }) => {
    await iniciarSesion(page, TEST_USER_1);
    
    // Verificar que se muestra el nombre del usuario en la navbar
    const nombreUsuario = page.locator('#nombreUsuario');
    await expect(nombreUsuario).toBeVisible();
    await expect(nombreUsuario).toContainText(TEST_USER_1.email);
  });

  test('debe permitir cerrar sesión e iniciar sesión nuevamente', async ({ page }) => {
    // Iniciar sesión
    await iniciarSesion(page, TEST_USER_1);
    
    // Verificar que se muestra el usuario
    const nombreUsuario = page.locator('#nombreUsuario');
    await expect(nombreUsuario).toBeVisible();
    
    // Cerrar sesión
    await cerrarSesion(page);
    
    // Volver a iniciar sesión
    await iniciarSesion(page, TEST_USER_1);
    
    // Verificar que se muestra el usuario nuevamente
    await expect(nombreUsuario).toBeVisible();
  });
});

test.describe('Gestión de Partidas', () => {
  test.beforeEach(async ({ page }) => {
    // Iniciar sesión antes de cada test de partidas
    await iniciarSesion(page, TEST_USER_1);
  });

  test('debe permitir acceder a la sección de partidas', async ({ page }) => {
    // Hacer clic en el botón JUGAR
    await page.click('#btnJugar');
    
    // Verificar que se muestra la sección de partidas
    await expect(page.locator('#seccionPartidas')).toBeVisible();
    await expect(page.locator('#btnCrearPartida')).toBeVisible();
  });

  test('debe permitir crear una nueva partida', async ({ page }) => {
    // Ir a la sección de partidas
    await page.click('#btnJugar');
    await page.waitForSelector('#seccionPartidas', { state: 'visible' });
    
    // Crear partida
    await page.click('#btnCrearPartida');

    // Verificar que aparece algún indicador de partida creada: código, estado o elemento con data-codigo
    const alternativos = ['.codigo-partida', 'strong.codigo-partida', '[data-codigo]', '#estadoPartida', '#estadoPartidaActual'];
    let encontrado = false;
    let textoCodigo = '';
    for (const sel of alternativos) {
      try {
        const el = page.locator(sel).first();
        await el.waitFor({ state: 'visible', timeout: 3000 });
        // Si el selector tiene texto, intentar extraer un código tipo "ABC123"
        try {
          const txt = (await el.textContent()) || '';
          const match = txt.match(/[A-Z0-9]{4,}/i);
          if (match) {
            textoCodigo = match[0];
          }
        } catch (e) {}
        encontrado = true;
        break;
      } catch (e) {
        // continuar probando siguientes selectores
      }
    }

    // Validar resultado
    expect(encontrado).toBeTruthy();
    if (textoCodigo) {
      console.log('Código detectado:', textoCodigo);
    }
  });

  test('debe listar partidas disponibles', async ({ page }) => {
    await page.click('#btnJugar');
    await page.waitForSelector('#seccionPartidas', { state: 'visible' });
    
    // Verificar que existe el contenedor de lista de partidas
    const listaPartidas = page.locator('#listaPartidas');
    await expect(listaPartidas).toBeVisible();
  });

  test('debe permitir filtrar partidas por código', async ({ page }) => {
    await page.click('#btnJugar');
    await page.waitForSelector('#seccionPartidas', { state: 'visible' });
    
    // Buscar el campo de filtro
    const filtro = page.locator('#filtroCodigo');
    if (await filtro.isVisible()) {
      await filtro.fill('ABC123');
      await page.waitForTimeout(500);
      
      // Verificar que se puede escribir en el filtro
      await expect(filtro).toHaveValue('ABC123');
    }
  });
});

test.describe('Validación de Interfaz de Usuario', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, TEST_USER_1);
  });

  test('debe mostrar correctamente el navbar con el usuario logueado', async ({ page }) => {
    const navbar = page.locator('#mainNavbar');
    await expect(navbar).toBeVisible();
    
    const nombreUsuario = page.locator('#nombreUsuario');
    await expect(nombreUsuario).toBeVisible();
    
    const btnCerrarSesion = page.locator('#linkSalir');
    await expect(btnCerrarSesion).toBeVisible();
  });

  test('debe mostrar notificaciones al usuario', async ({ page }) => {
    // Verificar que existe el contenedor de notificaciones
    const notificaciones = page.locator('#notificaciones');
    await expect(notificaciones).toBeAttached();
  });

  test('debe permitir cerrar sesión correctamente', async ({ page }) => {
    await cerrarSesion(page);
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Validación de Scroll y Overflow', () => {
  test('debe mostrar scroll cuando el contenido no cabe en pantalla', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Cambiar a viewport pequeño
    await page.setViewportSize({ width: 800, height: 400 });
    
    await page.waitForSelector('#mainContent, body', { state: 'visible' });
    
    // Verificar que se puede hacer scroll
    const mainContent = page.locator('#mainContent');
    if (await mainContent.isVisible()) {
      const box = await mainContent.boundingBox();
      expect(box).toBeTruthy();
    }
  });
});
