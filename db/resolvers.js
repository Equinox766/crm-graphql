const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
const Pedido = require("../models/Pedido");
const Cliente = require("../models/Cliente");

const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config({path: 'variables.env'});

const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;
    return jwt.sign({ id, email, nombre, apellido }, secreta, {expiresIn})
}
const resolvers = {
    Query: {

        //Seccion USUARIO
        obtenerUsuario: async (_, {}, ctx) => {
            return ctx.usuario;
        },

        //Seccion PRODUCTOS
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async (_,{ id }) => {
           //Revisar si el producto existe o no
           const producto = await Producto.findById(id);
           
           if (!producto) {
                throw new Error('Producto no encontado');
           }

           return producto;
        },
        //Seccion CLIENTES
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({})
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClienteVendedor: async (_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({ vendedor: ctx.usuario.id.toString() })
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente: async (_,{ id }, ctx) => {
            //Revisar si el Cliente existe o no
            const cliente = await Cliente.findById(id);
            
            if (!cliente) {
                 throw new Error('Cliente no encontado');
            }

            //Quien lo registro puede verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
 
            return cliente;
        },

        //Seccion PEDIDOS
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidoVendedor: async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({ vendedor: ctx.usuario.id });
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedido: async (_, {id}, ctx) => {
            //Si el pedido existe o no
            const pedido = await Pedido.findById(id)

            if (!pedido) {
                throw new Error('Pedido no encontrado');
            }

            //Solo quien creo puede verlo
            if(pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //retotnar el resultado
            return pedido;
        },
        obtenerPedidosEstado: async (_, {estado}, ctx) => {
            const pedidos = await Pedido.find({ vendedor: ctx.usuario.id, estado});

            return pedidos;
        },

        // Busquedas avanzadas!!
        mejoresClientes: async() => {
            const clientes = await Pedido.aggregate([
                { $match : { estado : "COMPLETADO"} },
                { $group : {
                        _id : "$cliente",
                        total : { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: "_id",
                        as: "cliente"
                    }
                },
                {
                    $limit: 10
                },
                {
                    $sort : { total : -1}
                }
            ]);

            return clientes;
        }, 
        mejoresVendedores: async() => {
            const vendedores = await Pedido.aggregate([
                { $match : { estado : "COMPLETADO"} },
                { $group : {
                        _id : "$vendedor",
                        total : { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: "_id",
                        as: "vendedor"
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort : { total : -1}
                }
            ]);

            return vendedores;
        },
        buscarProducto: async (_, {texto}) => {
            const productos = await Producto.find({ $text: { $search: texto}}).limit(10);

            return productos;
        }
    },
    Mutation: {
        // LOGIN AND AUTHENTICATE
        nuevoUsuario: async (_, {input}) => {
            const {email, password} = input;
            //Revisar si el usuario ya esta registrado
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario) {
                throw new Error('El usuario ya esta registrado');
            }

            //Hashear su password
            const saltRounds = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, saltRounds);



            //guardarlo en la DB
            try {
                const usuario = new Usuario(input);
                usuario.save(); // Guardarlo
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_, {input}) => {
            const {email, password} = input;
            //Revisar si el usuario esta registrado
            const existeUsuario = await Usuario.findOne({email});
            if (!existeUsuario) {
                throw new Error('El usuario no existe');
            }

            // Revisar si el password es el correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password);
            if (!passwordCorrecto) {
                throw new Error('La contraseña es incorrecta, intente nuevamente')
            }

            //Crear el token
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '24h')
            }

        },

        // Seccion de CRUD Producto
        nuevoProducto: async (_, {input}) => {
            try {
                const producto = new Producto(input);

                //Almacenar en la bd
                const resultado = await producto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto: async (_, {id, input}) => {
            //Revisar si el producto existe o no
           let producto = await Producto.findById(id);
           
           if (!producto) {
                throw new Error('Producto no encontado');
           }

           //Guardarlo en la bd
           producto = await Producto.findOneAndUpdate({_id : id}, input, { new: true });

           return producto;
        },
        eliminarProducto: async (_, { id }) => {
            let producto = await Producto.findById(id);
           
           if (!producto) {
                throw new Error('Producto no encontado');
           }

           // Eliminar 
           await Producto.findOneAndDelete({_id: id});

           return "Producto Eliminado";
        },

        // Seccion de CRUD Cliente
        nuevoCliente: async (_, {input}, ctx) => {
            //Verificar si el cliente ya esta registrado
            const { email } = input;

            const cliente = await Cliente.findOne({ email });
            if (cliente) {
                throw new Error('El Cliente ya esta registrado');
            }

            const nuevoCliente = new Cliente(input);

            //Asignarle el vendedor
            nuevoCliente.vendedor = ctx.usuario.id;

            //Guardarlo en la BD
            try {
                const resultado = await nuevoCliente.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarCliente: async (_, {id, input}, ctx) => {
            //Revisar si el Cliente existe o no
            let cliente = await Cliente.findById(id);
            
            if (!cliente) {
                 throw new Error('Cliente no encontado');
            }

            //Verificar si el vendedor es quien edita
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //Guardar en la BD
            cliente = await Cliente.findOneAndUpdate({_id : id}, input, { new: true });

           return cliente;
        },
        eliminarCliente: async (_, { id }, ctx) => {
            //Revisar si el Cliente existe o no
            let cliente = await Cliente.findById(id);
           
           
           if (!cliente) {
                throw new Error('Cliente no encontado');
           }

           //Verificar si el vendedor es quien edita
        //    if( cliente.vendedor.toString() !== ctx.usuario.id ) {
        //         throw new Error('No tienes las credenciales');
        //     }

           // Eliminar 
           await Cliente.findOneAndDelete({_id : id});

           return "Cliente Eliminado";
        },

        // Seccion de CRUD Pedido
        nuevoPedido: async (_, {input}, ctx) => {
            
            const { cliente } = input;

            // Verificar si el cliente existe o no
            let clienteExiste = await Cliente.findById(cliente);
           
           
            if (!clienteExiste) {
                    throw new Error('Cliente no encontado');
            }

            //Verificar si el cliete es del vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //Revisar que el stock este disponible
            for await (const articulo of input.pedido) {
                const { id } = articulo;
                const producto = await Producto.findById(id);
                if (articulo.cantidad > producto.existencia) {
                    throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                } else {
                    //Restar la cantidad disponible
                    producto.existencia = producto.existencia - articulo.cantidad;

                    await producto.save();
                }
            };

            //Crear un nuevo pedido

            const nuevoPedido = new Pedido(input);

            //Asignarle un vendedor

            nuevoPedido.vendedor = ctx.usuario.id;

            //guardar en la BD
            const resultado = await nuevoPedido.save();

            return resultado;

        },
        actualizarPedido: async (_, {id, input}, ctx) => {

            const { cliente } = input;

            // Si el pedido existe
            const existePedido = await Pedido.findById(id);
           
           
            if (!existePedido) {
                    throw new Error('Pedido no existe');
            }

            //Si el cliente existe
            const clienteExiste = await Cliente.findById(cliente);
           
           
            if (!clienteExiste) {
                    throw new Error('Cliente no encontado');
            }

            // Si pertenece al vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //Revisar stock
            if ( input.pedido ) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;
                    const producto = await Producto.findById(id);
                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                    } else {
                        //Restar la cantidad disponible
                        producto.existencia = producto.existencia - articulo.cantidad;

                        await producto.save();
                    }
                };
            }

            //Guardar el pedodo
            const resultado = await Pedido.findOneAndUpdate({ _id : id }, input, { new: true});
            return resultado;
        },
        eliminarPedido: async (_, {id}, ctx) => {
            // Si el pedido existe
            const pedido = await Pedido.findById(id);
           
           
            if (!pedido) {
                    throw new Error('Pedido no existe');
            }

            //Verificar si es el vendedor quien borra
            if(pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            // eliminar de la BD

            await Pedido.findOneAndDelete({ _id: id });
            return "Pedido eliminado"
        }

    }
}

module.exports = resolvers;