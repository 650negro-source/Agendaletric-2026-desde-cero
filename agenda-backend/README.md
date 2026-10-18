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
- Reportes técnicos con evidencias privadas, publicación y PDF descargable
- Catálogo de tipos de servicio asociado a nuevas citas
- Simulación y registro de notificaciones por correo (no se envían correos reales)
- Estructura modular por dominio
- Servidor listo para desarrollo con nodemon

## Tecnologías

- Node.js
- Express
- JavaScript
- MySQL2
- JWT (jsonwebtoken)
- bcrypt
- dotenv
- Multer (carga multipart de evidencias)
- PDFKit (generación de reportes PDF)
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

### Reportes técnicos

Las rutas están protegidas con JWT. Administradores y técnicos asignados pueden consultar y editar el reporte, cargar/descargar evidencias y publicarlo. El cliente propietario solo puede consultar y descargar el PDF cuando el reporte está publicado.

- `GET /api/reportes-tecnicos/:idCita` - Consultar reporte
- `PUT /api/reportes-tecnicos/:idCita` - Actualizar diagnóstico, procedimiento y observaciones
- `POST /api/reportes-tecnicos/:idCita/archivos` - Cargar un archivo JPG o MP4 (máximo 10 MB)
- `GET /api/reportes-tecnicos/:idCita/archivos/:idArchivo` - Descargar evidencia (administrador o técnico asignado)
- `POST /api/reportes-tecnicos/:idCita/enviar` - Publicar y registrar un correo simulado al cliente
- `POST /api/reportes-tecnicos/:idCita/solicitar-correccion` - Solicitar corrección (solo administrador; correo simulado al técnico)
- `GET /api/reportes-tecnicos/:idCita/pdf` - Descargar el PDF generado bajo demanda

Las evidencias se guardan en `storage/reportes-tecnicos` y no se sirven como archivos estáticos. Después de ejecutar `sql/reporte-tecnico.sql`, ejecuta una vez `sql/reporte-tecnico-flujo-completo.sql` en Workbench para agregar estados de publicación, evidencias y registro de envíos. Los reportes ya existentes quedan como borrador hasta que un usuario autorizado los publique.

### Tipos de servicio y citas

El catálogo se consulta mediante `GET /api/tipos-servicio`. Clientes y técnicos reciben solo servicios activos; el administrador recibe también los inactivos y puede gestionarlos:

- `GET /api/tipos-servicio/:id` - Consultar un servicio (administrador)
- `POST /api/tipos-servicio` - Crear servicio (administrador)
- `PUT /api/tipos-servicio/:id` - Actualizar nombre, descripción y, opcionalmente, si pide detalle (administrador)
- `PATCH /api/tipos-servicio/:id/estado` - Activar/desactivar servicio (administrador)

Para conectar el módulo a citas, selecciona un servicio activo al crear cada cita. El tipo de avería y la descripción del problema siguen siendo campos separados y obligatorios. Las citas históricas mantienen sus datos y reciben `NULL` en los campos nuevos; el nombre seleccionado se guarda como copia en la cita.

La opción `Otro servicio` del catálogo requiere `detalle_servicio`. Para crear una cita, incluye `id_tipo_servicio` y los campos que ya enviaba el cliente:

```json
{
  "id_vehiculo": 1,
  "id_tipo_averia": 1,
  "id_tipo_servicio": 11,
  "detalle_servicio": "Instalar una cámara de reversa",
  "fecha_programada": "2026-11-20",
  "hora_programada": "10:00",
  "descripcion_averia": "Quiero instalar una cámara en el vehículo"
}
```

El ID del ejemplo es ilustrativo: obtén el ID real de `GET /api/tipos-servicio` y usa el ID de `Otro servicio` solo cuando esa sea la opción elegida. En los demás servicios, omite `detalle_servicio`.

Ejecuta una sola vez `sql/tipos-servicio.sql` en Workbench, después de crear las tablas `cita` y `tipo_averia`. La migración agrega el catálogo con opciones iniciales y agrega a `cita` las columnas para el servicio y su detalle; no elimina ni modifica citas anteriores.

### Tipos de avería

El tipo de avería clasifica el problema reportado y se selecciona por separado del tipo de servicio. Para cargar las opciones iniciales en una tabla `tipo_averia` ya creada, ejecuta `sql/datos-iniciales-tipos-averia.sql` en Workbench. El script agrega solo los nombres que todavía no existan, por lo que no es necesario volver a ejecutar `sql/tipos-averia.sql`.

Consulta las opciones disponibles con `GET /api/tipos-averia` y usa el `id_tipo_averia` de un elemento activo al crear una cita.

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