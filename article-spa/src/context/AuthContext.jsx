import jwtDecode from "jwt-decode";
import { createContext, useEffect, useState } from "react";
import api from "../api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);        // { username, ... }
    const [tokens, setTokens] = useState(null);    // { access, refresh }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("authTokens");
        if (saved) {
            const parsed = JSON.parse(saved);
            setTokens(parsed);
            try {
                const decoded = jwtDecode(parsed.access);
                setUser({ username: decoded.username || decoded.user_id }); // adapt if you add custom claims
            } catch (_) {
                // invalid token -> clear
                localStorage.removeItem("authTokens");
            }
        }
        setLoading(false);
    }, []);

    const login = async ({ username, password }) => {
        // Django SimpleJWT expects username & password
        const res = await api.post("/token/", { username, password });
        const data = res.data; // {access, refresh}
        setTokens(data);
        localStorage.setItem("authTokens", JSON.stringify(data));
        const decoded = jwtDecode(data.access);
        setUser({ username: username || decoded.username });
    };

    const logout = () => {
        setTokens(null);
        setUser(null);
        localStorage.removeItem("authTokens");
    };

    const refreshToken = async () => {
        if (!tokens?.refresh) return logout();
        try {
            const res = await api.post("/token/refresh/", { refresh: tokens.refresh });
            const newTokens = { ...tokens, access: res.data.access };
            setTokens(newTokens);
            localStorage.setItem("authTokens", JSON.stringify(newTokens));
            return newTokens.access;
        } catch {
            logout();
        }
    };

    // (optional) auto refresh every ~4 minutes
    useEffect(() => {
        if (!tokens?.refresh) return;
        const id = setInterval(refreshToken, 4 * 60 * 1000);
        return () => clearInterval(id);
    }, [tokens]);

    return (
        <AuthContext.Provider value={{ user, tokens, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
