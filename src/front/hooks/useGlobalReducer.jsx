// useGlobalReducer.jsx
import { createContext, useContext, useReducer, useMemo } from "react";
import storeReducer, { initialState } from "../store.js";
const StoreCtx = createContext();

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "");

export function StoreProvider({ children }) {
    const [state, dispatch] = useReducer(storeReducer, initialState);

    const actions = useMemo(() => ({
        async login({ email, password }) {
            const r = await fetch(`${BASE}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(data?.message || "Credenciales inválidas");

            localStorage.setItem("tasky_user", JSON.stringify(data));
            dispatch({ type: "LOGIN_OK", user: data });
        },
        logout() {
            localStorage.removeItem("tasky_user");
            dispatch({ type: "LOGOUT" });
        },
    }), [dispatch]);

    const value = useMemo(() => ({ store: state, actions }), [state, actions]);

    return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
    return useContext(StoreCtx);
}
