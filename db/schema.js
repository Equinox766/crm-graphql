const { gql } = require("apollo-server");

//Schema
const typeDefs = gql`
    type Curso {
        titulo: String
        tecnologia: String
    }

    type tecnologia {
        tecnologia: String
    }
    input CursoInput {
        tecnologia: String

    }
    type Query {
        obtenerCursos(input: CursoInput!): [Curso]
        obtenerTecnologia: [tecnologia]
    }
`;

module.exports = typeDefs;