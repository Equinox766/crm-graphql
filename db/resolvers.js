const Usuario = require("../models/Usuario");
const CryptoJS = require("crypto-js");

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

            input.password = await CryptoJS.SHA256(password).toString();



            //guardarlo en la DB
            try {
                const usuario = new Usuario(input);
                usuario.save(); // Guardarlo
                return usuario;
            } catch (error) {
                console.log(error);
            }

            return "Creando..."
        }
    }
}

module.exports = resolvers;