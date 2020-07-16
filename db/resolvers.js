const Usuario = require("../models/Usuario");
const Proyecto = require("../models/Proyecto");
const Tarea = require("../models/Tarea");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "variables.env" });

const crearToken = (user, secret, expiresIn) => {
  const { id, email } = user;
  return jwt.sign({ id, email }, secret, { expiresIn });
};

const resolvers = {
  Query: {
    obtenerProyectos: async (_, {}, ctx) => {
      const proyectos = await Proyecto.find({ creador: ctx.usuario.id });
      return proyectos;
    },
    obtenerTareas: async (_, { input }, ctx) => {
      const { proyecto } = input;
      const tareas = await Tarea.find({ creador: ctx.usuario.id, proyecto });
      return tareas;
    },
  },
  Mutation: {
    crearUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) {
        throw new Error("El usuario ya está registrado");
      }
      try {
        const salt = await bcryptjs.genSalt(10);
        input.password = await bcryptjs.hash(password, salt);

        const nuevoUsuario = new Usuario(input);
        await nuevoUsuario.save();
        return "Usuario Creado Correctamente";
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;

      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }
      const passwordCorrecto = await bcryptjs.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error("Password Incorrecto");
      }

      return {
        token: crearToken(existeUsuario, process.env.SECRETA, "2hr"),
      };
    },
    nuevoProyecto: async (_, { input }, ctx) => {
      if (!ctx.usuario) {
        throw new Error("No token correcto");
      }
      try {
        const proyecto = new Proyecto(input);
        proyecto.creador = ctx.usuario.id;
        const res = proyecto.save();
        return res;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProyecto: async (_, { id, input }, ctx) => {
      let proyecto = await Proyecto.findById(id);
      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }
      if (proyecto.creador.toString() !== ctx.usuario.id) {
        throw new Error("404: No Authorized");
      }
      proyecto = await Proyecto.findByIdAndUpdate(id, input, { new: true });
      return proyecto;
    },
    eliminarProyecto: async (_, { id }, ctx) => {
      let proyecto = await Proyecto.findById(id);
      if (!proyecto) {
        throw new Error("Proyecto no encontrado");
      }
      if (proyecto.creador.toString() !== ctx.usuario.id) {
        throw new Error("404: No Authorized");
      }
      //Eliminar
      await Proyecto.findByIdAndDelete(id);
      return "Proyecto Eliminado";
    },
    nuevaTarea: async (_, { input }, ctx) => {
      try {
        const tarea = new Tarea(input);
        tarea.creador = ctx.usuario.id;
        const res = await tarea.save();
        return res;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarTarea: async (_, { id, input, estado }, ctx) => {
      let tarea = await Tarea.findById(id);
      if (!tarea) {
        throw new Error("Tarea no encontrada");
      }
      if (tarea.creador.toString() !== ctx.usuario.id) {
        throw new Error("404: No Authorized");
      }
      input.estado = estado;
      tarea = await Tarea.findByIdAndUpdate(id, input, { new: true });
      return tarea;
    },
    eliminarTarea: async (_, { id }, ctx) => {
      let tarea = await Tarea.findById(id);
      if (!tarea) {
        throw new Error("Tarea no encontrada");
      }
      if (tarea.creador.toString() !== ctx.usuario.id) {
        throw new Error("404: No Authorized");
      }
      //Eliminar
      await Tarea.findByIdAndDelete(id);
      return "Tarea Eliminada";
    }
  },
};

module.exports = resolvers;
