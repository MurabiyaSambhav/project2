import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
    const { login } = useContext(AuthContext);
    const [form, setForm] = useState({ username: "", password: "" });
    const [err, setErr] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        try {
            await login(form);
        } catch (error) {
            setErr("Invalid credentials");
        }
    };

    return (
        <form onSubmit={onSubmit} style={{ marginBottom: 16 }}>
            <h3>Login</h3>
            <input
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="submit">Login</button>
            {err && <p style={{ color: "crimson" }}>{err}</p>}
        </form>
    );
}
