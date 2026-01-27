# ClipStudio Pro
### SaaS para Creadores de Contenido - MVP

Esta aplicación permite transformar videos largos en contenido vertical optimizado para **YouTube Shorts** y **TikTok**.

## 🚀 Tecnologías
- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Auth**: NextAuth.js (Google OAuth 2.0)
- **Base de Datos**: Prisma + SQLite (fácil de migrar a Postgres)
- **Estilos**: Tailwind CSS 4 + Radix UI (Glassmorphism design)
- **Animaciones**: Framer Motion
- **Video**: React Player

## 🛠️ Configuración Local

1. **Clonar proyecto e instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar el entorno:**
   Crea un archivo `.env` (guíate por `.env.example`) con tus credenciales:
   - **DATABASE_URL**: "file:./dev.db"
   - **NEXTAUTH_SECRET**: Genera uno con `openssl rand -base64 32`
   - **GOOGLE_CLIENT_ID** y **SECRET**: Obténlos en [Google Cloud Console](https://console.cloud.google.com/)
     - Habilita: **YouTube Data API v3**
     - URIs de redirección: `http://localhost:3000/api/auth/callback/google`

3. **Inicializar Base de Datos:**
   ```bash
   npx prisma db push
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 🎥 Funcionalidades Implementadas
- [x] **Autenticación**: Login con Google y persistencia de sesión.
- [x] **Dashboard de Videos**: Interfaz premium para visualizar videos propios de YouTube.
- [x] **Editor de Clips**:
  - Reproductor integrado.
  - Timeline interactivo para recorte (start/end).
  - Validación de duración (máx 60s).
- [x] **Diseño Premium**: Dark mode por defecto con efectos de vidrio y gradientes vibrantes.
- [x] **Historial**: Seguimiento del estado de los clips (pending, success, error).

## ⚠️ Próximos Pasos (SaaS Ready)
- Implementar **FFmpeg.wasm** para procesamiento de video en el cliente.
- Integración real con el endpoint de subida de TikTok (requiere revisión de App por TikTok).
- Almacenamiento en S3/Google Cloud Storage para clips procesados.

## ⚖️ Disclaimer
Este proyecto utiliza únicamente APIs oficiales. El usuario debe poseer los derechos del contenido que procesa.
