# MatchPadel

Plataforma web para organizar y encontrar partidos de pádel en Valdivia, Chile.

## Tecnologías

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** con **PostgreSQL**
- **JWT** para autenticación (access + refresh tokens)
- **Zod** para validación de datos

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** + **shadcn/ui** para componentes
- **TanStack React Query** para gestión de estado del servidor
- **Zustand** para estado global de autenticación
- **React Router v6** para enrutamiento

## Funcionalidades

### Usuarios
- Registro y login con JWT
- Perfil editable (nombre, teléfono, categoría)
- Cambio de contraseña
- Categorías de juego: Séptima a Primera
- Dashboard con estadísticas personalizadas

### Partidos
- Crear, editar, cancelar partidos
- Unirse y salir de partidos
- Filtros por estado, categoría, club y fecha
- Registro de resultados (scores) post-partido
- Compartir partidos por WhatsApp

### Clubes
- Gestión de clubes y canchas
- Información de ubicación con Google Maps

### Ranking
- Ranking global de jugadores por partidos completados
- Visible en la landing page

### Administración
- Panel de admin con estadísticas generales
- Gestión de usuarios, clubes y canchas
- Vista general de partidos con filtros

## Estructura del Proyecto

```
MatchPadel/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (database)
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── modules/
│   │   │   ├── auth/        # Login, register, tokens
│   │   │   ├── clubs/       # Gestión de clubes
│   │   │   ├── matches/     # Partidos, scores
│   │   │   └── users/       # Perfil, stats, ranking
│   │   ├── prisma/          # Schema y migraciones
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helpers (API response, WhatsApp, etc.)
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── auth/        # Login, Register forms
│   │   │   ├── clubs/       # ClubCard, selectors
│   │   │   ├── icons/       # PadelIcon SVG custom
│   │   │   ├── layout/      # Navbar, Footer, Sidebar
│   │   │   ├── matches/     # MatchCard, MatchList, etc.
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── hooks/           # React Query hooks
│   │   ├── pages/           # Páginas (player, admin, public)
│   │   ├── services/        # API services (axios)
│   │   ├── stores/          # Zustand stores
│   │   └── types/           # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── nginx/                   # Configuración nginx
├── docker-compose.yml       # Desarrollo local
├── docker-compose.prod.yml  # Producción
└── .env.example
```

## Instalación Local

### Requisitos
- Docker y Docker Compose
- Node.js 20+ (para desarrollo sin Docker)

### Con Docker (recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/joyarzov/matchpadel.git
cd matchpadel

# Copiar variables de entorno
cp .env.example .env

# Levantar con Docker
docker compose up -d

# La aplicación estará disponible en:
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

### Sin Docker

```bash
# Backend
cd backend
npm install
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma db push --schema=src/prisma/schema.prisma
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users/ranking` - Ranking global (público)
- `GET /api/users/stats` - Estadísticas del usuario (auth)
- `GET /api/users/profile` - Perfil del usuario (auth)
- `PUT /api/users/profile` - Actualizar perfil (auth)
- `PUT /api/users/change-password` - Cambiar contraseña (auth)

### Matches
- `GET /api/matches` - Listar partidos (filtros)
- `GET /api/matches/:id` - Detalle de partido
- `GET /api/matches/:id/scores` - Resultados del partido
- `POST /api/matches` - Crear partido (auth)
- `PUT /api/matches/:id` - Actualizar partido (auth)
- `PATCH /api/matches/:id/cancel` - Cancelar partido (auth)
- `POST /api/matches/:id/join` - Unirse (auth)
- `DELETE /api/matches/:id/leave` - Salir (auth)
- `POST /api/matches/:id/score` - Registrar resultado (auth)

### Clubs (Admin)
- `GET /api/clubs` - Listar clubes
- `POST /api/clubs` - Crear club (admin)
- `PUT /api/clubs/:id` - Actualizar club (admin)

## Despliegue en Producción

```bash
# En el servidor
docker compose -f docker-compose.prod.yml up -d --build
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| DB_NAME | Nombre de la base de datos | padelmatch |
| DB_USER | Usuario de PostgreSQL | padelmatch_user |
| DB_PASSWORD | Contraseña de PostgreSQL | padelmatch_secret_2025 |
| JWT_SECRET | Clave secreta para JWT | — |
| JWT_REFRESH_SECRET | Clave para refresh tokens | — |
| NODE_ENV | Entorno (development/production) | development |
| FRONTEND_URL | URL del frontend (CORS) | http://localhost:5173 |
| VITE_API_URL | URL del API para el frontend | http://localhost:3000/api |

## Modelo de Datos

### Principales
- **User** - Usuarios con roles (PLAYER, ADMIN) y categorías
- **Club** - Clubes de pádel con ubicación
- **Court** - Canchas dentro de clubes
- **Match** - Partidos con estado (OPEN, FULL, IN_PROGRESS, COMPLETED, CANCELLED)
- **MatchPlayer** - Relación jugador-partido
- **MatchScore** - Resultados registrados por participantes

## Licencia

Proyecto privado - Todos los derechos reservados.
