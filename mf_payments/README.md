# KuisiScore SSR Frontend

KuisiScore es el frontend en Next.js que consume la API de pagos del backend `payments_app` usando SSR.

## Qué hace

- Renderiza la página principal y la vista de pagos desde el servidor.
- Consulta el estado del backend antes de pintar la interfaz.
- Envía el formulario a un route handler interno de Next.js.
- Reenvía el pago al backend Node con `POST /payments`.
- Muestra el resultado sin romper el flujo SSR.

## Flujo real

1. El usuario entra a `/payments`.
2. Next.js renderiza la página en servidor.
3. La página consulta el backend con `checkBackendStatus()`.
4. El usuario envía el formulario.
5. El route handler `src/app/api/payments/route.js` reenvía la petición a la API Node.
6. El backend responde.
7. Next.js redirige a `/payments?success=true...` o muestra el error.

## Estructura

```text
mf_payments/
  src/
    app/
      api/
        payments/
          route.js
      payments/
        page.js
      layout.js
      page.js
      globals.css
    lib/
      payments.js
  public/
    logo.svg
```

## Puertos

- Backend Node: `http://localhost:3000`
- Frontend Next.js: `http://localhost:3001`

## Variables de entorno

Crea un archivo `.env.local` en la raíz de `mf_payments`:

```env
PAYMENTS_API_URL=http://localhost:3000
```

## Cómo ejecutar

```bash
npm install
npm run dev
```

Luego abre:

```bash
http://localhost:3001/payments
```

## Qué valida la página

La tarjeta de estado de backend no hace pagos automáticos. Solo consulta un `GET /` para confirmar que el backend está arriba.

## Qué hace el formulario

El formulario envía:

```json
{
  "amount": 1500,
  "currency": "ARS",
  "method": "dummy",
  "customerEmail": "cliente@correo.com"
}
```

El route handler transforma ese formulario en JSON y lo manda al backend Node.

## UI

La interfaz usa Tailwind y está pensada como una demo más realista:

- hero principal con estado SSR
- panel lateral de checkout
- formulario de pago
- bloque de resultado y bloque de error

## Cómo funciona SSR aquí

La página `src/app/payments/page.js` es un Server Component. Eso significa que Next la renderiza en servidor antes de enviarla al navegador. La llamada al backend para el estado también ocurre desde el servidor.

## Archivos clave

- `src/app/payments/page.js`: vista SSR principal.
- `src/app/api/payments/route.js`: route handler del formulario.
- `src/lib/payments.js`: helper para llamar al backend.
- `src/app/layout.js`: layout global y branding.

## Nota

Este frontend no emula pagos por sí mismo. Su función es consumir la API real del backend y mostrar el resultado.
