const clienteService = require("./cliente.service");

async function createCliente(req, res, next) {
  try {
    const cliente = await clienteService.createCliente(req.body);

    return res.status(201).json({
      message: "Client created successfully",
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

async function getClientes(req, res, next) {
  try {
    const clientes = await clienteService.getClientes();

    return res.status(200).json({
      data: clientes,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyCliente(req, res, next) {
  try {
    const cliente = await clienteService.getClienteByUserId(req.user.id);

    return res.status(200).json({
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

async function createMyCliente(req, res, next) {
  try {
    const cliente = await clienteService.createClienteForUser(
      req.user.id,
      req.body
    );

    return res.status(201).json({
      message: "Client profile created successfully",
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

async function getClienteById(req, res, next) {
  try {
    const cliente = await clienteService.getClienteById(req.params.id);

    return res.status(200).json({
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMyCliente(req, res, next) {
  try {
    const cliente = await clienteService.updateClienteByUserId(req.user.id, req.body);

    return res.status(200).json({
      message: "Client updated successfully",
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

async function updateCliente(req, res, next) {
  try {
    const cliente = await clienteService.updateCliente(req.params.id, req.body);

    return res.status(200).json({
      message: "Client updated successfully",
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

async function changeClienteStatus(req, res, next) {
  try {
    const cliente = await clienteService.changeClienteStatus(req.params.id, req.body.estado);

    return res.status(200).json({
      message: "Client status updated successfully",
      data: cliente,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCliente(req, res, next) {
  try {
    await clienteService.deleteCliente(req.params.id);

    return res.status(200).json({
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCliente,
  getClientes,
  getMyCliente,
  createMyCliente,
  getClienteById,
  updateMyCliente,
  updateCliente,
  changeClienteStatus,
  deleteCliente,
};
