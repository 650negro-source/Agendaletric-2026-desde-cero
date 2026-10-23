# AgendaLetric Frontend

Frontend de AgendaLetric construido con React y Vite. El primer módulo conectado es la administración de usuarios del API existente.

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
| Listar usuarios | `GET /api/users` | Roles `1` y `3` |
| Crear usuario | `POST /api/users` | Rol `1` |
| Editar nombre, correo y rol | `PUT /api/users/:id` | Rol `1` |
| Cambiar estado | `PATCH /api/users/:id/status` | Roles `1` y `3` |
| Eliminación lógica | `DELETE /api/users/:id` | Rol `1` |

El formulario de creación requiere nombre, correo, contraseña de al menos 8 caracteres y rol. La edición no cambia la contraseña porque el endpoint `PUT` actual no admite ese campo. Los roles del selector corresponden a los existentes en la base de datos revisada (`SYSTEM_ADMIN` 1, `CUSTOMER` 2, `TECHNICIAN` 3); el backend no expone una ruta para consultar el catálogo de roles.

La aplicación valida el JWT consultando `GET /api/users/me` al iniciar y al iniciar sesión. Si el token vence, se elimina la sesión local y se solicita ingresar de nuevo. La acción **Ver** y la edición consultan `GET /api/users/:id`; el formulario de edición nunca carga ni envía una contraseña.

| Rol | Consultar listado/detalle/perfil | Cambiar estado | Crear/editar/eliminar |
| --- | --- | --- | --- |
| `SYSTEM_ADMIN` (`id_rol = 1`) | Sí | Sí | Sí |
| `CUSTOMER` (`id_rol = 2`) | Solo `/users/me` | No | No |
| `TECHNICIAN` (`id_rol = 3`) | Sí | Sí | No |

Estas reglas reflejan `agenda-backend/src/modules/users/user.routes.js`; los controles visuales no reemplazan la autorización del backend.

## Organización del código

```text
src/
  features/
    auth/                 Inicio de sesión
    users/                Pantalla, tabla, formulario, detalle y confirmación
  services/               Cliente HTTP, autenticación y endpoints de usuarios
  shared/                 Roles usados por la interfaz
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
6. Repite el acceso con un técnico: debe listar, ver detalles y cambiar estados; el backend debe responder 403 a crear, editar o eliminar.
7. Con un cliente, comprueba que `/users/me` funciona y que el módulo de usuarios no permite listar. Prueba además credenciales incorrectas, una sesión ausente y un token vencido.
8. En Postman prueba también los códigos 400 (campos/formato/rol inválido), 401 (sin token o token inválido), 403 (rol sin permiso), 404 (usuario inexistente) y 409 (correo duplicado).
9. En DevTools → Network comprueba `POST /api/auth/login`, `GET /api/users/me` al cargar y las solicitudes de usuarios; las rutas protegidas deben incluir `Authorization: Bearer <token>`. No copies el token en capturas.
10. Verifica la interfaz a 320 px y escritorio. Usa una base local y cuentas de prueba; nunca pruebes `DELETE` con datos reales.

Los scripts disponibles para validar el frontend son `npm run lint` y `npm run build`. El backend no declara pruebas automatizadas en su `package.json`; su script `npm test` devuelve deliberadamente “Error: no test specified”.
