import { useState } from "react";
import api from "../api";

export default function Register() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [msg, setMsg] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setMsg("");
        try {
            const res = await api.post("/register/", {
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
            });
            if (res.data.success) {
                setMsg("Registered! Now login with your username.");
            } else {
                setMsg(res.data.message || "Registration failed");
            }
        } catch {
            setMsg("Registration error");
        }
    };

    return (
        <form onSubmit={submit} style={{ marginBottom: 24 }}>
            <h3>Register</h3>
            <input placeholder="Username" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input type="password" placeholder="Password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="submit">Register</button>
            {msg && <p>{msg}</p>}
        </form>
    );
}
