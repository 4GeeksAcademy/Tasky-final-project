// src/front/store.js

// Estado inicial
export const initialStore = () => ({
  // Sesión (source of truth para saber si es guest/client/tasker)
  user: null, // { id: number, role: "client"|"tasker" }

  // Cosas viejas de demo
  message: null,
  todos: [
    { id: 1, title: "Make the bed", background: null },
    { id: 2, title: "Do my homework", background: null },
  ],
});

// Reducer
export default function storeReducer(state, action = {}) {
  switch (action.type) {
    // ====== Sesión (lo que usa tu app ahora) ======
    case "LOGIN":
    case "SET_USER": // alias por si alguien usa este nombre
      return { ...state, user: action.payload };

    case "LOGOUT":
    case "CLEAR_USER": // alias
      return { ...state, user: null };

    case "UPDATE_ROLE":
      return state.user
        ? { ...state, user: { ...state.user, role: action.payload } }
        : state;

    // ====== Acciones viejas de demo (compatibilidad) ======
    case "set_hello":
      return { ...state, message: action.payload };

    case "add_task": {
      const { id, color } = action.payload || {};
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, background: color } : t
        ),
      };
    }

    // ====== Default seguro ======
    default:
      return state;
  }
}
