const Usuario = require("../models/Usuario");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config({path: 'variables.env'});

const crearToken = (usuario, secreta, expiresIn) => {
    console.log(usuario);
    const {id, email, nombre, apellido} = usuario;
    return jwt.sign({id}, secreta, {expiresIn})
}

const resolvers = {
    Query: {
        obtenerCurso: () => "algo"
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

        }
    }
}

module.exports = resolvers;