# Integración de Google Auth en el Frontend

El botón de "Continuar con Google" ya ha sido agregado a la interfaz de usuario en la página de inicio de sesión (`src/pages/Login.tsx`), pero actualmente solo imprime un mensaje en la consola porque el endpoint del backend aún no está listo.

Una vez que el backend tenga implementado el endpoint para autenticación con Google (por ejemplo, `/api/auth/google`), deberás seguir estos pasos para conectar el frontend:

## 1. Actualizar el Cliente de API (`src/lib/apiClient.ts`)

Agrega un nuevo método en tu `authApi` para manejar la solicitud de Google.

```typescript
export const authApi = {
  // ... métodos existentes ...

  /**
   * Inicia sesión o registra un usuario usando un token de Google
   */
  loginWithGoogle: async (googleToken: string) => {
    return fetchApi("/auth/google", {
      method: "POST",
      body: JSON.stringify({ token: googleToken }),
    });
  },
};
```

## 2. Configurar Google Identity Services

Para obtener el token de Google desde el frontend, necesitarás usar la librería oficial de Google.

### Opción A: Usar `@react-oauth/google` (Recomendado)

1. Instala la librería:
   ```bash
   npm install @react-oauth/google
   ```

2. Envuelve tu aplicación (en `App.tsx` o `main.tsx`) con el proveedor:
   ```tsx
   import { GoogleOAuthProvider } from '@react-oauth/google';

   // ... dentro de tu render
   <GoogleOAuthProvider clientId="TU_GOOGLE_CLIENT_ID">
     <App />
   </GoogleOAuthProvider>
   ```

3. Modifica el botón en `src/pages/Login.tsx`:
   ```tsx
   import { useGoogleLogin } from '@react-oauth/google';

   // Dentro de tu componente Login:
   const googleLogin = useGoogleLogin({
     onSuccess: async (tokenResponse) => {
       try {
         setLoading(true);
         // 1. Envías el token de Google al backend
         const response = await authApi.loginWithGoogle(tokenResponse.access_token);
         
         // 2. El backend valida el token y te devuelve tu propio JWT
         const jwt = response.access_token || response.token;
         
         // 3. Guardas la sesión tal como lo haces en el login normal
         // login(jwt, userData);
         // navigate(from, { replace: true });
       } catch (error) {
         setError("Error al autenticar con Google");
       } finally {
         setLoading(false);
       }
     },
     onError: () => {
       setError("La autenticación con Google falló");
     }
   });

   // Y en tu botón cambias el onClick:
   <button type="button" onClick={() => googleLogin()}>
     Continuar con Google
   </button>
   ```

### Opción B: Redirección tradicional (OAuth Flow)

Si el backend se encarga de todo el flujo (redirección a la página de Google y callback):
Simplemente cambia el `onClick` del botón para redirigir al usuario al endpoint del backend:

```tsx
<button 
  type="button" 
  onClick={() => { window.location.href = "http://localhost:8000/api/auth/google/login"; }}
>
  Continuar con Google
</button>
```
*(Nota: En este caso, asegúrate de que el backend sepa cómo redirigir de vuelta al frontend con el token JWT en la URL o en una cookie).*

## Resumen

1. Tener listo tu **Google Client ID** desde la consola de Google Cloud.
2. Instalar el paquete de Google OAuth si decides manejar el popup en el frontend.
3. Llamar al nuevo método del backend enviándole el token recibido de Google.
4. Usar el JWT de respuesta para establecer la sesión (exactamente igual que en el login por correo).
