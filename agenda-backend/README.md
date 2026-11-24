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

Las rutas de gestión de usuarios son exclusivas de `SYSTEM_ADMIN`. El técnico no puede consultar ni cambiar el estado de cuentas; sus permisos para cancelar o reprogramar citas se aplican en las rutas propias de citas. La creación desde `/api/users` acepta cuentas de administrador o técnico. Las cuentas de cliente deben crearse mediante el registro de clientes para que también quede creado su perfil.

El sistema impide desactivar, eliminar o cambiar el rol de la última cuenta `SYSTEM_ADMIN` activa.

### Acceso y autenticación

El módulo de autenticación está disponible en `src/modules/auth`:

- `POST /api/auth/login`
- `PATCH /api/auth/change-password` - Requiere JWT y la contraseña actual.
- `POST /api/clientes` - Registro público que asigna exclusivamente el rol `CUSTOMER`.

El inicio de sesión permite cinco intentos fallidos por dirección IP cada 15 minutos; la respuesta de credenciales inválidas es genérica. El contador usa memoria del proceso, por lo que un despliegue con varias instancias debe configurar un almacén compartido. Las contraseñas nuevas deben tener entre 10 y 64 caracteres, no incluir espacios y contener mayúscula, minúscula, número y símbolo; también se rechazan algunos patrones comunes. Se comparan exactamente como se reciben y se almacenan con bcrypt. El registro y la creación administrativa requieren confirmar la contraseña. La recuperación de contraseña por correo queda pendiente de configurar un proveedor de correo real.

El campo de correo mantiene el límite actual de 150 caracteres de la base de datos, aunque la guía propone hasta 254; ampliarlo requiere una migración del esquema. Cambiar la contraseña no invalida otros JWT ya emitidos; vencen según `JWT_EXPIRES_IN`.

El frontend conserva el JWT temporalmente en `sessionStorage` para esta etapa de desarrollo. Antes de publicar el sistema, se debe decidir si migrarlo a cookie `HttpOnly`, `Secure` y `SameSite` y configurar la protección CSRF correspondiente.

Los IDs de rol se mantienen: `SYSTEM_ADMIN` (1), `CUSTOMER` (2) y `TECHNICIAN` (3).

Las cuentas existentes conservan sus contraseñas actuales para que puedan iniciar sesión; al cambiarlas deberán cumplir la nueva política.

### Clientes

El registro público crea una cuenta `CUSTOMER` y su perfil en una transacción. La cédula debe tener de 6 a 10 dígitos numéricos y ser única; el celular debe tener 10 dígitos y comenzar por 3. El cliente puede consultar y actualizar su propio perfil, incluida la cédula, siempre que no esté registrada en otra cuenta. Solo `SYSTEM_ADMIN` puede listar, consultar, actualizar, activar, desactivar o dar de baja perfiles de clientes.

- `GET /api/clientes/me` y `PUT /api/clientes/me` - Consultar y actualizar el perfil propio (cliente)
- `GET /api/clientes` - Listar clientes (administrador)
- `GET /api/clientes/:id` y `PUT /api/clientes/:id` - Consultar y actualizar un cliente (administrador)
- `PATCH /api/clientes/:id/status` - Activar o desactivar el acceso (administrador)
- `DELETE /api/clientes/:id` - Baja lógica: deshabilita la cuenta y conserva sus registros (administrador)

### Vehículos

Los clientes pueden registrar y administrar únicamente los vehículos asociados a su propio perfil. Administración puede consultar y gestionar los vehículos de cualquier cliente, y debe indicar el cliente al crear uno. Los técnicos no tienen acceso a estas rutas. Las placas se normalizan a mayúscula, deben usar el formato colombiano de automóvil (`AAA999`) y son únicas. Se admiten automóvil, camioneta, camión u otro vehículo terrestre; las fuentes de energía son gasolina, diésel, híbrido y eléctrico.

- `POST /api/vehiculos` - Registrar vehículo (cliente autenticado; administración debe enviar `id_cliente`)
- `GET /api/vehiculos` - Listar vehículos propios (cliente) o todos (administrador)
- `GET /api/vehiculos/:id` y `PUT /api/vehiculos/:id` - Consultar y actualizar un vehículo propio (cliente) o cualquiera (administrador)
- `PATCH /api/vehiculos/:id/status` - Activar o dar de baja lógicamente un vehículo

La baja conserva las citas anteriores y bloquea el uso del vehículo en citas nuevas; no se permite desactivarlo mientras tenga una cita activa. Si el vehículo ya tiene citas, no se puede cambiar su placa porque estas muestran la placa actual del registro. Para reemplazarlo, registra el vehículo nuevo y da de baja el anterior. El propietario no se cambia al editar un vehículo.

Para una instalación nueva, `sql/vehiculo.sql` crea la tabla con las columnas actuales. Si la tabla ya existe, revisa y resuelve primero placas repetidas o con formato distinto a `AAA999`:

```sql
SELECT UPPER(TRIM(placa)) AS placa_normalizada, COUNT(*) AS cantidad
FROM vehiculo
GROUP BY UPPER(TRIM(placa))
HAVING COUNT(*) > 1;

SELECT id_vehiculo, placa
FROM vehiculo
WHERE UPPER(TRIM(placa)) NOT REGEXP '^[A-Z]{3}[0-9]{3}$';
```

Después ejecuta una sola vez `sql/vehiculo-modulo.sql`. La migración conserva vehículos existentes y les asigna estado activo; tipo y energía quedan pendientes de completar al editar cada registro. La migración normaliza las placas y agrega el índice único, por lo que fallará explícitamente si aún existen placas duplicadas.

### Compatibilidad de inicio de sesión

La autenticación usa JWT y las rutas protegidas consultan el estado actual de la cuenta en MySQL.

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
- `PUT /api/tipos-servicio/:id` - Actualizar nombre, descripción, detalle requerido y duración estimada (administrador)
- `PATCH /api/tipos-servicio/:id/estado` - Activar/desactivar servicio (administrador)

La duración se configura en minutos, de 60 a 360 en incrementos de 60. Un servicio activo sin duración no puede reservarse. La duración usada se copia en la cita, para que futuros cambios del catálogo no alteren reservas existentes.

Para consultar horarios disponibles usa `GET /api/citas/disponibilidad?fecha=AAAA-MM-DD&id_tipo_servicio=ID`; al reprogramar agrega `id_cita=ID`. La disponibilidad presenta inicios cada hora, verifica la duración completa dentro del horario del técnico y respeta un margen de 30 minutos entre trabajos. Crear y reprogramar vuelven a validar el horario y asignan el técnico automáticamente dentro de una transacción. La reserva exige 24 horas de anticipación; cancelar o reprogramar una cita existente exige 12 horas. Cada cliente puede tener una sola cita activa.

El cliente puede crear y consultar sus citas, y cancelar o reprogramar las propias. El administrador consulta y gestiona todas las citas; el técnico consulta las asignadas y puede gestionar su estado, cancelar o reprogramar las asignadas. Solo administrador y técnico pueden validar, iniciar y finalizar una atención. Al finalizar se genera el reporte técnico.

El tipo de avería y la descripción del problema son campos separados y obligatorios. Las citas históricas mantienen los datos guardados y reciben `NULL` en los campos de duración y servicio que no existían; el nombre seleccionado se guarda como copia en la cita.

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

Para una instalación nueva, ejecuta `sql/tipos-servicio.sql` después de crear las tablas `cita` y `tipo_averia`. En una base que ya tiene catálogo y citas, ejecuta una sola vez `sql/citas-duracion.sql` para agregar las duraciones; no vuelvas a ejecutar esa migración ni el script de catálogo que agrega columnas ya existentes. La migración deja la duración de servicios y citas anteriores sin configurar: administración debe completar la duración de cada servicio antes de habilitar reservas nuevas.

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