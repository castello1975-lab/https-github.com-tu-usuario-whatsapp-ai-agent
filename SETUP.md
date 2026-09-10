# Guía de configuración

Esta guía te lleva paso a paso por todas las cuentas y credenciales que
necesita el proyecto. El código ya está construido — aquí solo hay que crear
cuentas, copiar claves y pegarlas en `.env.local`.

## 0. Requisitos

- Node.js y npm (ya comprobado en tu equipo).
- Un número de teléfono para pruebas de WhatsApp (puede ser tu propio móvil).

```bash
npm install
```

## 1. Supabase (base de datos + autenticación)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta / inicia sesión.
2. Crea una organización (plan gratuito) y luego un **New Project**.
   - Elige una contraseña de base de datos y guárdala.
   - Elige la región más cercana a ti.
3. Cuando el proyecto esté listo, ve a **Project Settings > API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (¡no la compartas, tiene acceso total!)
4. Ve a **SQL Editor**, pega el contenido completo de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   y pulsa **Run**.
5. Verifica en **Table Editor** que se han creado todas las tablas
   (`organizations`, `profiles`, `conversations`, `messages`, `appointments`, etc.).

## 2. Anthropic (el modelo Claude que responde por WhatsApp)

1. Ve a [console.anthropic.com](https://console.anthropic.com) y crea una cuenta.
2. Carga crédito en **Billing** (unos pocos dólares son más que suficientes para probar).
3. Ve a **API Keys**, crea una nueva clave y cópiala en `ANTHROPIC_API_KEY`.
4. Deja `ANTHROPIC_MODEL=claude-sonnet-5` tal cual, salvo que quieras usar otro modelo.

## 3. Google Cloud (Google Calendar)

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) y crea un proyecto nuevo.
2. Ve a **APIs & Services > Library**, busca **Google Calendar API** y actívala.
3. Ve a **APIs & Services > OAuth consent screen**:
   - Tipo de usuario: **External**.
   - Rellena el nombre de la app y tu correo.
   - En **Test users**, añade tu propio correo de Google (mientras la app no esté verificada, solo estos usuarios podrán conectar su calendario).
4. Ve a **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
   - Tipo de aplicación: **Web application**.
   - En **Authorized redirect URIs**, añade exactamente:
     `http://localhost:3000/api/auth/google/callback`
5. Copia el **Client ID** → `GOOGLE_CLIENT_ID` y el **Client secret** → `GOOGLE_CLIENT_SECRET`.
6. Deja `GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback`.

## 4. Clave de cifrado

Los tokens de Google se guardan cifrados en la base de datos. Genera la clave:

```bash
node scripts/gen-encryption-key.mjs
```

Copia el valor que imprime en `ENCRYPTION_KEY`.

## 5. Completa `.env.local`

Copia el archivo de ejemplo y rellénalo con todo lo anterior:

```bash
cp .env.local.example .env.local
```

En este punto ya deberías tener rellenas todas las variables **excepto** las
de `WHATSAPP_*` (eso viene en el paso 7).

## 6. Arranca la app en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000), regístrate (nombre, nombre
del negocio, zona horaria, correo, contraseña) y entra al panel. Este template
es de **un solo negocio por deployment**: el registro solo funciona una vez.

## 7. ngrok (túnel para el webhook de WhatsApp)

Meta necesita una URL pública HTTPS para enviarte los mensajes entrantes.

1. Ve a [ngrok.com](https://ngrok.com), crea una cuenta gratuita y sigue las
   instrucciones para instalar el CLI y autenticarlo (`ngrok config add-authtoken ...`).
2. Con la app corriendo en el puerto 3000, en otra terminal:
   ```bash
   ngrok http 3000
   ```
3. Copia la URL `https://xxxx.ngrok-free.app` que te da — la necesitarás en el paso 8.
   Mientras hagas pruebas, puedes poner esa misma URL en `NEXT_PUBLIC_APP_URL`.

## 8. Meta for Developers (WhatsApp Cloud API — modo de prueba)

1. Necesitas una cuenta de Facebook. Ve a
   [business.facebook.com](https://business.facebook.com) y, si no tienes página
   ni portfolio empresarial, crea una página (cualquier nombre/categoría sirve
   para pruebas) y un portfolio empresarial.
2. Ve a [developers.facebook.com](https://developers.facebook.com), inicia
   sesión, y en **My Apps > Create App** elige el caso de uso
   **"Connect with customers through WhatsApp"**, asociado a tu portfolio empresarial.
3. Dentro de la app, ve a **WhatsApp > API Setup**:
   - Copia el **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`.
   - Copia el **WhatsApp Business Account ID** → `WHATSAPP_BUSINESS_ACCOUNT_ID`.
   - Copia el **Temporary access token** → `WHATSAPP_ACCESS_TOKEN` (caduca en 24h;
     para algo más permanente, genera un token de **System User** desde Business
     Settings con permisos `whatsapp_business_messaging` y `whatsapp_business_management`,
     caducidad "nunca").
   - En **To**, añade tu propio número de WhatsApp como destinatario de prueba
     (te llegará un código de verificación por WhatsApp).
4. Ve a **App Settings > Basic** y copia el **App Secret** → `WHATSAPP_APP_SECRET`.
5. Elige tú mismo un texto aleatorio para `WHATSAPP_VERIFY_TOKEN` (cualquier
   cadena; solo tiene que coincidir con lo que pongas en el siguiente paso).
6. Vuelve a rellenar `.env.local` con estos 5 valores y reinicia `npm run dev`.
7. Ve a **WhatsApp > Configuration**:
   - **Webhook URL**: `<tu-url-de-ngrok>/api/webhooks/whatsapp`
   - **Verify token**: el mismo valor que pusiste en `WHATSAPP_VERIFY_TOKEN`
   - Pulsa **Verify and save**.
   - En **Webhook fields**, suscríbete al campo **messages**.

## 9. Primera prueba end-to-end

1. Desde el panel, ve a **Personalización** y rellena al menos un servicio,
   los horarios y el system prompt (ya vienen valores por defecto razonables).
2. Ve a **Integraciones** y conecta Google Calendar; elige el calendario a sincronizar.
3. Desde tu WhatsApp personal, escribe al número de prueba de Meta.
4. Deberías ver la respuesta del bot, la conversación en **Conversaciones**, y
   si agendas una cita, debería aparecer en **Citas** y en tu Google Calendar real.
5. Prueba a desactivar el bot desde una conversación y a escribir tú mismo
   desde el panel — el mensaje debe llegar por WhatsApp.

## Solución de problemas

| Síntoma | Causa probable |
|---|---|
| Meta da error 403 al verificar el webhook | `WHATSAPP_VERIFY_TOKEN` no coincide entre `.env.local` y la configuración de Meta |
| El envío de mensajes falla con 401 | El token temporal de WhatsApp caducó (dura 24h) — genera uno nuevo o usa un token de System User |
| Google Calendar da error 403 | La Calendar API no está activada, o tu correo no está en "Test users" de la pantalla de consentimiento |
| Supabase da "permission denied" | Estás usando la `anon key` en una ruta server-only que necesita la `service_role key` |
| El bot no responde nada | Revisa los logs de `npm run dev`; comprueba que `ANTHROPIC_API_KEY` tiene crédito |
