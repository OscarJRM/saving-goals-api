# Savings Goals API 🏦🎯

Esta API permite a los usuarios establecer metas de ahorro, realizar contribuciones y retiros, y recibir sugerencias personalizadas para optimizar su ahorro. Además, cuenta con un asistente virtual que ofrece recomendaciones financieras basadas en el comportamiento del usuario.

## Características Clave ✨

- 🔐 Autenticación JWT con Passport
- 📈 CRUD completo para:
  - Metas de ahorro
  - Contribuciones
  - Retiros
  - Categorías
  - Sugerencias personalizadas
- 🤖 Integración con OpenRouter IA para:
  - Recomendaciones financieras
  - Análisis de hábitos de ahorro
  - Asistente virtual
- 📧 Sistema de notificaciones:
  - Recordatorios programados (Cron Jobs)
  - Alertas de progreso
  - Plantillas personalizadas (HBS)
- 🛠️ Herramientas de desarrollo:
  - Pre-commits con Husky
  - Formateo automático (Prettier)
  - Linting (ESLint)

## Tecnologías 🛠️

| Categoría         | Tecnologías                   |
| ----------------- | ----------------------------- |
| Backend           | NestJS, Node.js 22.14, Bun    |
| Base de Datos     | PostgreSQL 17, Prisma ORM     |
| Autenticación     | Passport-JWT                  |
| Documentación     | Swagger UI                    |
| DevOps            | Docker, Git                   |
| Calidad de Código | Husky, Prettier, ESLint       |
| Testing           | Postman                       |
| Email             | Nodemailer con plantillas HBS |

## Estructura del Proyecto 📂

```bash
src/
├── auth/ # Autenticación JWT
├── goals/ # Lógica de metas de ahorro
├── contributions/ # Manejo de contribuciones
├── withdrawals/ # Gestión de retiros
├── categories/ # CRUD categorías
├── ai-assistant/ # Integración OpenRouter IA
├── mail/ # Sistema de notificaciones
├── cron/ # Tareas programadas
├── common/ # Utilidades compartidas
└── prisma/ # Esquema y migraciones DB
```

## Requisitos 📋

- Node.js 22.14+
- Bun (opcional para desarrollo)
- PostgreSQL 17
- Docker (para desarrollo con contenedores)

## Configuración ⚙️

1. Clonar repositorio:

```bash
git clone [repo-url]
cd saving-goals-api
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno (crear archivo .env basado en el ejemplo):

```bash
PORT=3000
DB_PORT=5460
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=saving-goals-db
DATABASE_URL=postgresql://postgres:postgres@localhost:5460/saving-goals-db
JWT_SECRET=top_secret
GMAIL_USER=tu_email@gmail.com
GMAIL_PASSWORD=tu_password_app
IA_API_KEY=tu_key_openrouter
IA_API_URL=https://openrouter.ai/api/v1/chat/completions
```

4. Iniciar base de datos con Docker:

```bash
docker compose up -d
```

5. Ejecutar migraciones y seed inicial:

```bash
bun prisma generate
bun prisma db:seed
```

6. Iniciar servidor en desarrollo:

```bash
bun dev
```

## Diagrama de Arquitectura 🏗️

![Diagrama de Arquitectura](public/arquitectura.png)

## Flujo Principal 🔄

![Flujo Principal](public/flujo-principal.png)

## Flujo de Autenticación 🔑

![Flujo de Autenticación](public/flujo-auth.png)
