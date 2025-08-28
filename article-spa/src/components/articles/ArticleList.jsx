import { useEffect, useState } from "react";
import api from "../api";
import CommentBox from "./CommentBox";
import LikeButton from "./LikeButton";

export default function ArticleList() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const res = await api.get("/articles/"); // GET /api/articles/
        setArticles(res.data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    if (loading) return <p>Loading articles…</p>;

    return (
        <ul>
            {articles.map((a) => (
                <li key={a.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
                    <h3>{a.title}</h3>
                    <p>{a.content}</p>
                    <div style={{ display: "flex", gap: 12 }}>
                        <LikeButton articleId={a.id} onChange={load} />
                    </div>
                    <CommentBox articleId={a.id} />
                </li>
            ))}
        </ul>
    );
}
