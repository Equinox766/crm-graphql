
const cursos =[
    {
        titulo: "xd 1",
        tecnologia: "React"
    },{
        titulo: "xd 2",
        tecnologia: "NodeJS"
    },{
        titulo: "xd 3",
        tecnologia: "Laravel"
    },{
        titulo: "xd 4",
        tecnologia: "Angular"
    },
];

const resolvers = {
    Query: {
        obtenerCursos: (_, {input}, ctx) => {
            console.log(ctx);
            const resultado = cursos.filter( curso => curso.tecnologia === input.tecnologia);
            return resultado;
        },
        obtenerTecnologia: () => cursos
    }
}

module.exports = resolvers;