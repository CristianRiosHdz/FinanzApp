# FinanzApp - Control de Gastos Personales

FinanzApp es una aplicación web moderna orientada a la gestión de finanzas personales, permitiendo el registro rápido de ingresos, gastos diarios, el seguimiento de metas de ahorro y la visualización del estado financiero mediante un diseño interactivo (Glassmorphism).

## 🛠 Arquitectura y Tecnologías
La aplicación fue construida utilizando un ecosistema potente y escalable:
- **Framework Frontend:** Next.js 14 / 15 con App Router & Turbopack
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS y un sistema de variables de entorno CSS puro (Vanilla CSS vars) bajo el concepto "Glassmorphism".
- **Estado Global:** Zustand con persistencia combinada (`persist` middleware para guardar el estado no-sensible mientras se enlaza a Supabase).
- **Manejo de Formularios:** React Hook Form + Zod.
- **Gráficos e Indicadores:** Recharts (Gráficos interactivos Responsive).
- **Notificaciones:** react-hot-toast.
- **Base de Datos / Backend / Auth:** Supabase.

## ✨ Funcionalidades Principales
- **Sistema de Autenticación:** Login y Registro estructurados para integrarse vía Supabase Auth.
- **Gestión de Gastos y Categorías:** Agrega cualquier gasto, categorízalo (con íconos y reglas de presupuesto), añade descripciones y filtra montos directamente.
- **Gestión de Ingresos:** Diferencia entre salario básico, pagos como freelance o transferencias alternas.
- **Dashboard Estadístico y Análisis:** Ten a un vistazo tus gastos del mes frente a lo generado. Tableros inteligentes reportan alertas en base al nivel de ahorro si excede un límite porcentual perjudicial.
- **Metas de Ahorro:** Define una meta con un monto, color y un ícono. Deposita fondos incrementalmente hacia ella con una barra visual y proyección de fechas.
- **Modo Oscuro/Claro nativo:** Interfaz diseñada que adapta sombras y fondos de manera estéticamente premium.

---

## 🚀 Despliegue en Vercel y Github

Para hospedar tu propia versión de esta aplicación remotamente, **Vercel** es la plataforma ideal, dada su compatibilidad impecable con entornos Next.js. El procedimiento toma solamente un par de minutos:

### Paso 1: Subir el proyecto a GitHub
Deberás subir la carpeta entera a tu propio repositorio de Github:
1. Crea un repositorio vacío en tu cuenta de [GitHub](https://github.com/).
2. Desde la terminal en el directorio principal de este proyecto (`Control_Gastos`), inicia tu historial remoto:
   ```bash
   git init
   git add .
   git commit -m "Commit inicial: Lanzamiento de FinanzApp"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
*(Aclaración: Tu archivo `.env.local` que contiene credenciales ha sido ignorado automáticamente para proteger tu privacidad. Solo se subirá el molde de `.env.example`).*

### Paso 2: Desplegar desde Vercel
1. Ingresa a [Vercel](https://vercel.com/) y entra (Sign in) vinculando tu cuenta de GitHub.
2. Da clic en **Add New Project**.
3. Selecciona tu repositorio recién subido de "FinanzApp".
4. Asegúrate que en Framework Preset figure automáticamente **Next.js**.
5. ¡MUY IMPORTANTE!: En el apartado de **Environment Variables (Variables de entorno)**, debes añadir tus claves de Supabase para que Vercel conecte con la base de datos de producción:
   - `NEXT_PUBLIC_SUPABASE_URL` = [Aquí tu URL de tu proyecto de Supabase]
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = [Aquí tu respectiva llave pública anonimada]
6. Haz clic en **Deploy**. 
En un par de minutos, Vercel compilará la aplicación y te asignará una URL en la nube pública gratuita.

---

## 💻 Desarrollo Local (Localhost)

Si deseas trabajar en tu computadora y probar la app fuera de línea:
1. Asegúrate de tener Node.js instalado.
2. Clona el repositorio u abre tu directorio local.
3. Instala las dependencias: `npm install`
4. Copia el archivo `.env.example` y renómbralo a `.env.local`, colocando adentro tus credenciales de [Supabase](https://supabase.com).
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
6. Visita `http://localhost:3000` en tu navegador.

*Consulta el documento adjunto `Instrucciones_BaseDeDatos.md` si necesitas los scripts explícitos a correr en Supabase para replicar las tablas (Profiles, Incomes, Categories, Expenses, Goals).*
