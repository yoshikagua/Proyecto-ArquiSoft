# Pendientes y mejoras por implementar

Este documento resume los cambios funcionales y técnicos pendientes para cerrar el flujo completo de gestión de partituras.

## 1) Edición de partituras en frontend

- Habilitar UI para editar una partitura desde la vista de perfil y/o detalle.
- Permitir modificar: título, autor, año, género, formato de agrupación, descripción, instrumentos.
- Conectar con mutación/endpoint de backend para `update_score`.
- Validar permisos: solo el propietario (o roles administrativos según política).

## 2) Mostrar cantidad de comentarios en el buscador del frontend

- Agregar contador de comentarios por partitura en la tarjeta/listado de `Partituras`.
- Usar `comentarios.length` desde los datos de backend (sin cálculo mock).
- Mantener consistencia visual con likes y descargas.

## 3) En detalle de partitura mostrar: quién la subió, formato y tipo de archivo

- Mostrar nombre/id del usuario que la subió.
- Mostrar formato de agrupación.
- Mostrar tipo de archivo (PDF, MusicXML, MIDI, etc.).
- Si backend no retorna nombre del uploader, resolver vía endpoint de usuario o campo denormalizado.

## 4) Añadir al backend datos de dificultad y tipo de archivo

- Extender modelo de partitura en backend con:
  - `difficulty` (ej. Básico, Intermedio, Avanzado)
  - `file_type` (ej. PDF, MusicXML, MIDI)
- Actualizar esquema GraphQL (`ScoreType`) y mutaciones de creación/edición.
- Actualizar seeds y validaciones.
- Definir valores permitidos para evitar inconsistencias.

## 5) Añadir filtros en el buscador

- Incorporar filtros por:
  - Dificultad
  - Instrumento
  - Género
  - Formato
- Soportar combinación de filtros (AND lógico).
- Mantener búsqueda por texto y paginación/orden si aplica.

## 6) Moderación por admins: ban de usuarios y eliminación de partituras

- Permitir que `admin` pueda banear/desbanear usuarios desde panel administrativo.
- Permitir que `admin` pueda eliminar partituras (aunque no sea el propietario) bajo reglas de moderación.
- Registrar auditoría mínima: quién ejecutó la acción, cuándo y motivo opcional.
- Reflejar estado de usuario baneado en frontend (bloqueo de login/acciones según política).

## 7) Permisos ampliados de superadmin y visibilidad de rol en frontend

- Permitir que `superadmin` gestione roles (`user`, `admin`, `superadmin`) además de todos los permisos de `admin`.
- Definir restricciones de seguridad para evitar escalamiento indebido de privilegios.
- Mostrar en frontend un indicador claro del rol actual del usuario:
  - `Admin`
  - `Dueño` / `SuperAdmin`
- Mostrar este indicador en zonas clave (navbar, perfil, panel de administración).

---

## Recomendaciones adicionales (faltantes importantes)

Puntos que conviene agregar para evitar errores:

1. Contrato de datos único frontend-backend
- Definir oficialmente los campos de partitura (incluyendo `difficulty`, `file_type`, `uploaded_by`) y sus tipos.
- Evitar duplicidades de idioma/catálogo (ej. `Baroque` vs `Barroco`).

2. Permisos y seguridad de edición
- Verificar en backend que solo dueño/admin/superadmin pueda editar o eliminar.
- Cubrir con pruebas de autorización.

3. Políticas de moderación y roles
- Definir reglas explícitas para ban de usuarios, eliminación de contenido y gestión de roles.
- Incluir validaciones para que solo `superadmin` pueda asignar o retirar roles administrativos.

4. Pruebas automáticas
- Agregar pruebas de integración/E2E para:
  - Editar partitura
  - Filtros combinados
  - Render correcto de metadatos en detalle/listado
  - Baneo/desbaneo de usuarios y efectos en login
  - Gestión de roles por `superadmin`