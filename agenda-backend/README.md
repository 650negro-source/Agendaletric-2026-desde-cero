# AgendaLetric Backend

Backend del sistema AgendaLetric desarrollado con Node.js y Express. Este proyecto centraliza la lógica de negocio, la gestión de usuarios, la autenticación y la conexión con MySQL para servir datos al frontend.

## Descripción

Este proyecto corresponde a la capa de servidor de AgendaLetric. Su propósito es exponer una API REST segura y modular para gestionar usuarios, sesiones y operaciones relacionadas con la administración del sistema.

## Funcionalidades

- API REST para gestión de usuarios
- Autenticación con JWT
- Encriptación de contraseñas con bcrypt
- Validación de entradas en capas de rutas y servicios
- Manejo centralizado de errores
- Conexión a base de datos MySQL
- Estructura modular por dominio (`auth`, `users`)
- Servidor listo para desarrollo con nodemon

## Tecnologías

- Node.js
- Express
- JavaScript
- MySQL2
- JWT (jsonwebtoken)
- bcrypt
- dotenv
- nodemon

## Requisitos previos

- Node.js 18 o superior
- npm
- MySQL instalado y ejecutándose
- Acceso a una base de datos local o remota
- Git

## Instalación

1. Abre la terminal y accede al backend:

```bash
cd agenda-backend
```

2. Instala las dependencias:

```bash
npm install
```

3. Crea el archivo de entorno a partir del ejemplo:

```bash
cp .env.example .env
```

Si no existe el archivo `.env.example`, puedes crear `.env` manualmente con las variables que se muestran en la sección siguiente.

## Ejecución

Modo producción:

```bash
npm start
```

Modo desarrollo:

```bash
npm run dev
```

## Variables de entorno

Ejemplo de configuración:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=agendaletric
DB_PORT=3306
JWT_SECRET=tu_secret_super_segura
JWT_EXPIRES_IN=2h
```

El proyecto ya incluye una configuración de ejemplo en el archivo `.env` del entorno actual, con los valores requeridos para conectarse a MySQL y generar tokens JWT.

## Estructura del proyecto

```text
agenda-backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── role.middleware.js
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.js
│       │   ├── auth.repository.js
│       │   ├── auth.routes.js
│       │   ├── auth.service.js
│       │   └── auth.validator.js
│       └── users/
│           ├── user.controller.js
│           ├── user.repository.js
│           ├── user.routes.js
│           ├── user.service.js
│           └── user.validator.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── ...
```

## Endpoints principales

### Salud del servidor

- `GET /api/health`

### Usuarios

- `POST /api/users` - Crear usuario
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `PATCH /api/users/:id/status` - Cambiar estado del usuario
- `DELETE /api/users/:id` - Eliminación lógica

### Autenticación

El módulo de autenticación está disponible en `src/modules/auth` y contempla el login con JWT:

- `POST /api/auth/login`

> La ruta se configura en el módulo de autenticación y puede montarse en la aplicación principal según la estructura de enrutamiento definitiva del proyecto.

## Seguridad

- Las credenciales y secretos se almacenan en variables de entorno.
- Las contraseñas se manejan con hashing mediante `bcrypt`.
- Los tokens se generan con `jsonwebtoken` para proteger rutas autenticadas.

## Convenciones

- Mantener rutas organizadas por módulos.
- Separar lógica de negocio en servicios.
- Centralizar la validación de entradas.
- Manejar errores con un middleware global.
- Usar variables de entorno para toda configuración sensible.

## Licencia

Este proyecto se distribuye bajo la licencia ISC.

## Nota

Asegúrate de que el frontend y el backend usen la misma configuración de CORS, puertos y credenciales para evitar errores de comunicación en local.