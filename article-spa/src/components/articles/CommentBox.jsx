import { useEffect, useState } from "react";
import api from "../api";

export default function CommentBox({ articleId }) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [err, setErr] = useState("");

    const load = async () => {
        const res = await api.get(`/articles/${articleId}/comments/`);
        setComments(res.data);
    };

    const post = async () => {
        setErr("");
        if (!content.trim()) return;
        try {
            await api.post(`/articles/${articleId}/comments/`, { content });
            setContent("");
            await load();
        } catch {
            setErr("Login required to comment.");
        }
    };

    useEffect(() => { load(); }, [articleId]);

    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a comment"
                    style={{ flex: 1 }}
                />
                <button onClick={post}>Add</button>
            </div>
            {err && <div style={{ color: "crimson" }}>{err}</div>}
            <div style={{ marginTop: 8 }}>
                {comments.map((c) => (
                    <p key={c.id}><b>{c.user_username || c.user}</b>: {c.content}</p>
                ))}
            </div>
        </div>
    );
}
