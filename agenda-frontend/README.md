# AgendaLetric Frontend

Frontend de AgendaLetric construido con React y Vite. Incluye autenticación y módulos conectados al backend para administración, clientes y técnicos.

## Estado actual del proyecto

El frontend ya incluye:

- Login con `POST /api/auth/login` y almacenamiento temporal del JWT en `sessionStorage`.
- Registro público de clientes; las cuentas de técnicos y administradores las crea un administrador.
- Cambio de contraseña autenticado para los tres roles.
- Validación automática de la sesión con `GET /api/users/me` al cargar la app.
- Recuperación de sesión vencida con cierre de sesión automática y reingreso.
- Módulo de usuarios con listado, búsqueda, detalle, creación, edición, cambio de estado y eliminación lógica.
- Perfil propio para clientes y directorio administrativo de clientes con consulta, edición, estado y baja lógica.
- Gestión de vehículos propia para clientes y administrativa, con validación de placa, tipo, energía y estado.
- Módulo de citas por rol: reservas y reprogramación para clientes, gestión de estados para técnicos y administración, y configuración de duración por servicio.
- Controles de permisos por rol según el backend (`SYSTEM_ADMIN`, `TECHNICIAN`, `CUSTOMER`).
- Gestión de usuarios, clientes y configuración de servicios visible solo para administración.
- Manejo de estados de carga, vacío, error y mensajes de éxito.
- Integración con el cliente HTTP centralizado y validaciones de respuesta en cada servicio.

La guía de implementación y validación está en [`documentacion/guia-frontend-02-agendaletric.pdf`](./documentacion/guia-frontend-02-agendaletric.pdf).

## Requisitos

- Node.js y npm instalados.
- MySQL iniciado y configurado para el backend.
- Backend iniciado en `http://localhost:3000`.
- Un usuario activo con rol `SYSTEM_ADMIN` (id `1`) para probar todas las operaciones.

## Inicio local

En una terminal, iniciar el backend:

```powershell
cd agenda-backend
npm run dev
```

En otra terminal, iniciar Vite:

```powershell
cd agenda-frontend
npm install
npm run dev
```

Abrir la URL que muestra Vite, normalmente `http://localhost:5173`. Vite reenvía `/api` a `http://localhost:3000`, por lo que el desarrollo local no requiere habilitar CORS en Express.

La configuración pública del frontend se puede documentar en `.env.example`. El valor predeterminado de `VITE_API_URL` es `/api`. No guardar contraseñas, secretos JWT ni credenciales de base de datos en variables `VITE_`.

## Módulo de usuarios

La interfaz inicia sesión mediante `POST /api/auth/login`, conserva el JWT en `sessionStorage` y lo envía como `Authorization: Bearer <token>` en las rutas protegidas. Al cerrar la pestaña, la sesión temporal se descarta.

| Acción | Ruta existente | Permiso del backend |
| --- | --- | --- |
| Iniciar sesión | `POST /api/auth/login` | Credenciales válidas y cuenta activa |
| Listar usuarios | `GET /api/users` | Rol `1` |
| Crear usuario | `POST /api/users` | Rol `1` |
| Editar nombre, correo y rol permitido | `PUT /api/users/:id` | Rol `1` |
| Cambiar estado | `PATCH /api/users/:id/status` | Rol `1` |
| Eliminación lógica | `DELETE /api/users/:id` | Rol `1` |
| Cambiar contraseña | `PATCH /api/auth/change-password` | Cualquier usuario autenticado |
| Registrar cliente | `POST /api/clientes` | Público; solo asigna rol `CUSTOMER` |

El formulario de creación requiere nombre válido, correo, contraseña y confirmación. Las contraseñas nuevas deben tener entre 10 y 64 caracteres, sin espacios, y contener mayúscula, minúscula, número y símbolo. El registro de clientes también solicita documento, teléfono y confirmación; los clientes no pueden asignarse otro rol mediante esa ruta. Las cuentas de cliente existentes conservan su perfil y no pueden cambiar de rol desde la gestión genérica de usuarios.

La aplicación valida el JWT consultando `GET /api/users/me` al iniciar y al iniciar sesión. Si el token vence, se elimina la sesión local y se solicita ingresar de nuevo. La acción **Ver** y la edición consultan `GET /api/users/:id`; el formulario de edición nunca carga ni envía una contraseña. El sistema protege la última cuenta administradora activa.

## Módulo de clientes

El cliente puede consultar y editar su propio perfil, incluido el número de cédula. La cédula acepta únicamente de 6 a 10 dígitos y el celular debe tener 10 dígitos y comenzar por `3`; el backend conserva la unicidad del correo y de la cédula. La sesión actualiza el nombre y correo del encabezado al guardar el perfil.

Administración dispone de un directorio con búsqueda, consulta de detalle, edición, activación/desactivación y baja lógica. La baja deshabilita la cuenta y conserva sus registros. La autorización se aplica en el backend, además de ocultar las funciones no permitidas en la interfaz.

| Acción | Ruta | Permiso |
| --- | --- | --- |
| Consultar perfil propio | `GET /api/clientes/me` | `CUSTOMER` |
| Actualizar perfil propio | `PUT /api/clientes/me` | `CUSTOMER` |
| Listar clientes | `GET /api/clientes` | `SYSTEM_ADMIN` |
| Consultar y actualizar cliente | `GET/PUT /api/clientes/:id` | `SYSTEM_ADMIN` |
| Activar o desactivar cliente | `PATCH /api/clientes/:id/status` | `SYSTEM_ADMIN` |
| Baja lógica de cliente | `DELETE /api/clientes/:id` | `SYSTEM_ADMIN` |

## Módulo de vehículos

Los clientes pueden registrar, consultar, editar y dar de baja sus propios vehículos. Administración puede hacer lo mismo para cualquier cliente y debe seleccionar al propietario al registrar uno. El backend obtiene la identidad del cliente desde el token y verifica también que el vehículo le pertenezca al crear una cita. Los técnicos no pueden acceder a la gestión de vehículos.

Se admiten automóviles, camionetas, camiones y otros vehículos terrestres (no motos), con energía gasolina, diésel, híbrida o eléctrica. La placa se normaliza a mayúscula, debe tener formato colombiano de 3 letras y 3 números, y ser única. Si un vehículo tiene citas, su placa no se puede editar; al reemplazarlo se registra el nuevo y se da de baja el anterior para conservar el historial.

| Acción | Ruta | Permiso |
| --- | --- | --- |
| Registrar vehículo | `POST /api/vehiculos` | `CUSTOMER` (propio) o `SYSTEM_ADMIN` (requiere `id_cliente`) |
| Listar vehículos | `GET /api/vehiculos` | `CUSTOMER` (propios) o `SYSTEM_ADMIN` (todos) |
| Consultar/editar vehículo | `GET/PUT /api/vehiculos/:id` | Propietario o `SYSTEM_ADMIN` |
| Activar/dar de baja | `PATCH /api/vehiculos/:id/status` | Propietario o `SYSTEM_ADMIN` |

La baja es lógica: conserva el vehículo y sus citas, pero impide usarlo para solicitar nuevas. No se puede dar de baja un vehículo con citas activas. La administración puede asignar el propietario al crear; editar no permite transferir un vehículo a otro cliente.

## Módulo de citas

El cliente solicita una cita con un vehículo propio activo, tipo de avería, servicio y descripción. La interfaz consulta los horarios disponibles cada hora y el backend asigna automáticamente un técnico. El servicio debe tener una duración configurada por administración (de 1 a 6 horas); se conserva una copia de esa duración en cada cita. Los horarios requieren 24 horas de anticipación y consideran el tiempo total de servicio más un margen de 30 minutos. Se permite una sola cita activa por cliente; cancelar o reprogramar requiere 12 horas de anticipación.

Clientes consultan, cancelan y reprograman sus citas; técnicos ven sus asignaciones y gestionan el avance hasta finalizar, lo cual requiere diagnóstico y procedimiento para generar el reporte; administración ve todas las citas y configura las duraciones. La API vuelve a comprobar disponibilidad al reservar o reprogramar, por lo que un horario puede dejar de estar libre entre la consulta y la confirmación.

| Acción | Ruta | Permiso |
| --- | --- | --- |
| Listar citas | `GET /api/citas` | `SYSTEM_ADMIN`, `CUSTOMER` (propias), `TECHNICIAN` (asignadas) |
| Consultar horarios | `GET /api/citas/disponibilidad?fecha=AAAA-MM-DD&id_tipo_servicio=ID` | Usuario autenticado; `id_cita` opcional para reprogramar una cita autorizada |
| Solicitar cita | `POST /api/citas` | `CUSTOMER` |
| Cancelar/reprogramar | `PATCH /api/citas/:id/cancelar`, `PATCH /api/citas/:id/reprogramar` | Propietario, técnico asignado o `SYSTEM_ADMIN` |
| Validar/iniciar/finalizar | `PATCH /api/citas/:id/validar`, `/iniciar`, `/finalizar` | Técnico asignado o `SYSTEM_ADMIN` |
| Configurar duración de servicio | `PUT /api/tipos-servicio/:id` | `SYSTEM_ADMIN` |

Acceso a la **gestión de usuarios** (no incluye las operaciones del perfil de cliente descritas en la sección siguiente):

| Rol | Consultar usuarios | Cambiar estado | Crear/editar/eliminar usuarios |
| --- | --- | --- | --- |
| `SYSTEM_ADMIN` (`id_rol = 1`) | Sí | Sí | Sí |
| `CUSTOMER` (`id_rol = 2`) | Solo su perfil de usuario (`/api/users/me`) | No | No |
| `TECHNICIAN` (`id_rol = 3`) | Solo su perfil (`/api/users/me`) | No | No |

Estas reglas reflejan `agenda-backend/src/modules/users/user.routes.js`; los controles visuales no reemplazan la autorización del backend.

## Organización del código

```text
src/
  features/
    auth/                 Inicio de sesión y registro de clientes
    clientes/             Perfil propio y gestión administrativa de clientes
    citas/                Reservas, agenda por rol y duración de servicios
    vehiculos/            Vehículos propios y gestión administrativa
    users/                Pantalla, tabla, formulario, detalle y confirmación
  services/               Cliente HTTP, autenticación, usuarios, clientes y vehículos
  shared/                 Roles y políticas de validación
  App.jsx                 Sesión, restauración del perfil y estructura principal
  main.jsx                Montaje de React y estilos globales
```

El frontend oculta acciones que el rol no puede ejecutar, pero la autorización efectiva sigue siendo responsabilidad del middleware del backend.

## Verificación manual

1. Desde la raíz del proyecto, abre una terminal para cada proceso:

   ```powershell
   cd agenda-backend
   npm run dev
   ```

   ```powershell
   cd agenda-frontend
   npm install
   npm run dev
   ```

2. Confirma que `http://localhost:3000/api/health` responde HTTP 200 y abre la URL que muestra Vite, normalmente `http://localhost:5173`.
3. Inicia sesión con una cuenta activa. Usa `SYSTEM_ADMIN` para probar el CRUD; las cuentas y contraseñas existentes se consultan/configuran localmente, no hay claves predeterminadas en el frontend.
4. Comprueba el listado, búsqueda, actualización, **Ver** (detalle consultado por ID) y los estados de carga, vacío y error.
5. Como administrador, crea una cuenta de prueba con correo nuevo, edítala, cambia su estado y elimínala lógicamente. Comprueba cada cambio en el listado y en MySQL.
6. Repite el acceso con un técnico: debe ver solo sus citas asignadas y no debe listar usuarios ni cambiar el estado de cuentas; las rutas administrativas deben responder 403.
7. Con un cliente, consulta y edita el perfil. Prueba cédula con 6 y 10 dígitos, cédula duplicada, celular válido de 10 dígitos iniciado por 3 y valores inválidos; verifica que el encabezado cambie al guardar.
8. Con administración, busca, consulta, edita, activa/desactiva y da de baja lógicamente un cliente de prueba. Verifica que la baja deshabilite el acceso y conserve sus registros.
9. Prueba el registro de cliente con datos nuevos y confirma que se crea con rol `CUSTOMER`; verifica que cédula con letras, menos de 6 o más de 10 dígitos y celular que no cumpla el formato se rechacen.
10. Como cliente, registra varios vehículos, edita uno, reemplázalo con un registro nuevo y da de baja el anterior. Comprueba que no puedas ver ni editar el vehículo de otro cliente.
11. Como administrador, revisa la relación de cada vehículo con su cliente, prueba placa duplicada y formatos inválidos, y comprueba que una moto no se acepte.
12. Verifica que no se permita usar vehículos inactivos para crear citas ni dar de baja vehículos con citas activas; confirma que las citas anteriores sigan mostrando su placa.
13. Como administración, configura la duración de cada servicio de 1 a 6 horas; confirma que los servicios sin duración no aparezcan como reservables.
14. Como cliente, solicita una cita, consulta los horarios disponibles, verifica la asignación automática y prueba cancelación/reprogramación dentro y fuera de las ventanas de 12/24 horas. Intenta solicitar una segunda cita activa.
15. Como técnico, valida e inicia una cita asignada, finalízala con diagnóstico y procedimiento, y verifica que el reporte técnico se genere. Confirma que no pueda gestionar citas de otro técnico.
16. En Postman prueba también los códigos 400 (campos y formatos inválidos), 401 (sin token o token inválido), 403 (rol sin permiso), 404 (registro inexistente), 409 (conflicto de horario, duración pendiente o estado) y 429 (límite de login).
17. Comprueba el cambio de contraseña con contraseña actual incorrecta, confirmación distinta y contraseña válida. Verifica que login compare la contraseña exactamente, incluidos espacios.
18. En DevTools → Network comprueba `POST /api/auth/login`, `GET /api/users/me` al cargar y las solicitudes protegidas con `Authorization: Bearer <token>`. No copies el token en capturas.
19. Verifica la interfaz a 320 px y escritorio. Usa una base local y cuentas de prueba; nunca pruebes `DELETE` con datos reales.

Los scripts disponibles para validar el frontend son `npm run lint` y `npm run build`. En el backend ejecuta `npm test` para las pruebas de políticas de contraseña, clientes y vehículos.
