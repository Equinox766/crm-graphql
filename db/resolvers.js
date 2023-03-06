const Usuario = require("../models/Usuario");
const Producto = require("../models/Producto");
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
        obtenerUsuario: async (_, { token }) => {
            const usuarioId = await jwt.verify(token, process.env.SECRETA);

            return usuarioId;
        },
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
    },
    Mutation: {
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

        // Seccion de CRUD Producto
        nuevoCliente: async (_, {input}, ctx) => {
            console.log(ctx);
            //Verificar si el cliente ya esta registrado
            const { email } = input;

            const cliente = Cliente.findOne({ email });
            if (!cliente) {
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
           if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

           // Eliminar 
           await cliente.findOneAndDelete({_id: id});

           return "Cliente Eliminado";
        },

    }
}

module.exports = resolvers;