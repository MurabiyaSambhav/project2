import LikeButton from "./LikeButton";
import CommentBox from "./CommentBox";


export default function ArticleItem({ article }) {
    return (
        <div style={{ border: "1px solid #ccc", marginBottom: "15px", padding: "10px" }}>
            <h3>{article.author_name}</h3>
            <h2>{article.title}</h2>
            <p>{article.content}</p>
            <div>
                <strong>Tags:</strong> {article.tag_list.join(", ")}
            </div>
            <LikeButton article={article} />
            <CommentBox article={article} />
        </div>
    );
}
