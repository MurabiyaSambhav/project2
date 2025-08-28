import { useState } from "react";
import api from "../api";

export default function LikeButton({ articleId, onChange }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const toggleLike = async () => {
        setBusy(true);
        setError("");
        try {
            // POST /api/articles/:id/like/
            const res = await api.post(`/articles/${articleId}/like/`);
            // res.data => { liked: boolean, likes: number }
            onChange?.();
        } catch {
            setError("Login required to like.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <button disabled={busy} onClick={toggleLike}>Like / Unlike</button>
            {error && <span style={{ color: "crimson", marginLeft: 8 }}>{error}</span>}
        </div>
    );
}
