const express = require('express');

const userRoutes = require('./modules/users/user.routes');

const errorHandler = require('./middlewares/error.middleware');

const authRoutes = require("./modules/auth/auth.routes");

const clienteRoutes = require("./modules/clientes/cliente.routes");

const vehiculoRoutes = require("./modules/vehiculos/vehiculo.routes");

const horarioRoutes = require("./modules/horarios/horario.routes");

const citaRoutes = require("./modules/citas/cita.routes");

const reporteTecnicoRoutes = require("./modules/reportes-tecnicos/reporte-tecnico.routes");

const tecnicoRoutes = require("./modules/tecnicos/tecnico.routes");

const tipoAveriaRoutes = require("./modules/tipos-averia/tipo-averia.routes");

const tipoServicioRoutes = require("./modules/tipos-servicio/tipo-servicio.routes");

const app = express();

app.use(express.json());

// Comprobación del servidor
app.get('/api/health', (req, res) => {
res.status(200).json({
status: 'ok',
message: 'Agendaletric-2026 API is running'
});
});

// Rutas de usuarios
app.use('/api/users', userRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/clientes", clienteRoutes);

app.use("/api/vehiculos", vehiculoRoutes);

app.use("/api/horarios", horarioRoutes);

app.use("/api/citas", citaRoutes);

app.use("/api/reportes-tecnicos", reporteTecnicoRoutes);

app.use("/api/tecnicos", tecnicoRoutes);

app.use("/api/tipos-averia", tipoAveriaRoutes);

app.use("/api/tipos-servicio", tipoServicioRoutes);

// Middleware global de errores
app.use(errorHandler);

module.exports = app;
