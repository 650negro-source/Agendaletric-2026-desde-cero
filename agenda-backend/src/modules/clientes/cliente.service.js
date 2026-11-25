const bcrypt = require("bcrypt");
const clienteRepository = require("./cliente.repository");

async function createCliente(clienteData) {
  const { nombre_completo, documento_identidad, telefono, correo, contrasena, direccion } = clienteData;

  const existingEmail = await clienteRepository.findByEmail(correo);
  if (existingEmail) {
    const error = new Error("Email is already registered");
    error.status = 409;
    throw error;
  }

  const existingDocument = await clienteRepository.findByDocumento(documento_identidad);
  if (existingDocument) {
    const error = new Error("Identity document already registered");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(contrasena, 10);

  const newCliente = {
    nombre_completo,
    documento_identidad,
    telefono,
    correo,
    contrasena: hashedPassword,
    direccion,
  };

  let clienteIds;
  try {
    clienteIds = await clienteRepository.createWithUser(newCliente);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Email or identity document is already registered");
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }

  return {
    id_cliente: clienteIds.id_cliente,
    id_usuario: clienteIds.id_usuario,
    nombre_completo,
    documento_identidad,
    telefono,
    correo,
    direccion,
  };
}

async function getClientes() {
  return await clienteRepository.findAll();
}

async function getClienteById(id) {
  const cliente = await clienteRepository.findById(id);

  if (!cliente) {
    const error = new Error("Client not found");
    error.status = 404;
    throw error;
  }

  return cliente;
}

async function getClienteByUserId(idUsuario) {
  const cliente = await clienteRepository.findByUserId(idUsuario);

  if (!cliente) {
    const error = new Error("Customer profile not found");
    error.status = 404;
    throw error;
  }

  return cliente;
}

async function createClienteForUser(idUsuario, clienteData) {
  const existingDocument = await clienteRepository.findByDocumento(
    clienteData.documento_identidad
  );
  if (existingDocument) {
    const error = new Error("Identity document already registered");
    error.status = 409;
    throw error;
  }

  const existingEmail = await clienteRepository.findByEmail(clienteData.correo);
  if (existingEmail && Number(existingEmail.id_usuario) !== Number(idUsuario)) {
    const error = new Error("Email is already registered");
    error.status = 409;
    throw error;
  }

  try {
    await clienteRepository.createForUser(idUsuario, clienteData);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Email or identity document is already registered");
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }

  return clienteRepository.findByUserId(idUsuario);
}

async function updateCliente(id, clienteData) {
  const cliente = await clienteRepository.findById(id);

  if (!cliente) {
    const error = new Error("Client not found");
    error.status = 404;
    throw error;
  }

  const existingDocument = await clienteRepository.findByDocumento(clienteData.documento_identidad);
  if (existingDocument && existingDocument.id_cliente !== Number(id)) {
    const error = new Error("Identity document already registered");
    error.status = 409;
    throw error;
  }

  const existingEmail = await clienteRepository.findByEmail(clienteData.correo);
  if (existingEmail && existingEmail.id_usuario !== cliente.id_usuario) {
    const error = new Error("Email is already registered");
    error.status = 409;
    throw error;
  }

  try {
    await clienteRepository.update(id, clienteData);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Email or identity document is already registered");
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }

  return clienteRepository.findById(id);
}

async function updateClienteByUserId(idUsuario, clienteData) {
  const cliente = await clienteRepository.findByUserId(idUsuario);
  if (!cliente) {
    const error = new Error("Client not found");
    error.status = 404;
    throw error;
  }

  return updateCliente(cliente.id_cliente, clienteData);
}

async function changeClienteStatus(id, estado) {
  const cliente = await clienteRepository.findById(id);

  if (!cliente) {
    const error = new Error("Client not found");
    error.status = 404;
    throw error;
  }

  await clienteRepository.updateStatus(id, estado);

  return await clienteRepository.findById(id);
}

async function deleteCliente(id) {
  const cliente = await clienteRepository.findById(id);

  if (!cliente) {
    const error = new Error("Client not found");
    error.status = 404;
    throw error;
  }

  await clienteRepository.softDelete(id);
}

module.exports = {
  createCliente,
  getClientes,
  getClienteByUserId,
  createClienteForUser,
  getClienteById,
  updateClienteByUserId,
  updateCliente,
  changeClienteStatus,
  deleteCliente,
};
