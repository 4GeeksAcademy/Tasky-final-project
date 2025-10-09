export const initialState = {
  user: JSON.parse(localStorage.getItem("tasky_user") || "null"),
};

export default function storeReducer(state, action) {
  switch (action.type) {
    case "LOGIN_OK":
      return { ...state, user: action.user };
    case "LOGOUT":
      return { ...state, user: null };
    default:
      return state; // IMPORTANT: don't throw
  }
}
