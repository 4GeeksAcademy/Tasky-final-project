// src/front/hooks/useGlobalReducer.jsx
import { useContext, useReducer, createContext, useEffect } from "react"; // ⬅️ + useEffect
import storeReducer, { initialStore } from "../store";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
    const [store, dispatch] = useReducer(storeReducer, initialStore());

    const actions = {
        login: (user) => dispatch({ type: "LOGIN", payload: user }),
        logout: () => dispatch({ type: "LOGOUT" }),
        updateRole: (role) => dispatch({ type: "UPDATE_ROLE", payload: role }),
    };

    // 1) Hidratar desde localStorage en el primer render
    useEffect(() => {
        try {
            if (!store.user) {
                const saved = localStorage.getItem("authUser");
                if (saved) actions.login(JSON.parse(saved));
            }
        } catch { /* noop */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2) Persistir en localStorage cada vez que cambie el user
    useEffect(() => {
        try {
            if (store.user) localStorage.setItem("authUser", JSON.stringify(store.user));
            else localStorage.removeItem("authUser");
        } catch { /* noop */ }
    }, [store.user]);

    // 3) Solo en DEV: permitir setear rol/usuario vía query string (?as=tasker|client|guest&uid=2)
    useEffect(() => {
        if (!import.meta.env.DEV) return;
        const url = new URL(window.location.href);
        const as = url.searchParams.get("as");   // "tasker" | "client" | "guest"
        const uid = url.searchParams.get("uid"); // id opcional
        if (as === "guest") {
            actions.logout();
        } else if (as === "tasker" || as === "client") {
            const id = Number(uid || (as === "client" ? 1 : 2));
            actions.login({ id, role: as });
        }
        // sin deps: que corra una vez por carga
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // (Opcional) Exponer para probar por consola en dev
    if (import.meta.env.DEV) {
        // @ts-ignore
        window.storeDebug = { store, actions };
    }

    return (
        <StoreContext.Provider value={{ store, actions }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    return useContext(StoreContext);
}
