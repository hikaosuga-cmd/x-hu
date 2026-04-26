"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Post } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setPosts(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
      fetchPosts();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/login");
      else setUser(session.user);
    });

    return () => listener.subscription.unsubscribe();
  }, [router, fetchPosts]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setPosting(true);

    const { error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, content: content.trim(), user_email: user.email });

    if (!error) {
      setContent("");
      fetchPosts();
    }
    setPosting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDelete = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    fetchPosts();
  };

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 80 }}>読み込み中...</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
          borderBottom: "1px solid #e1e4e8",
          position: "sticky",
          top: 0,
          backgroundColor: "white",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: "bold", margin: 0 }}>X-hu</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#666" }}>{user?.email}</span>
          <button onClick={handleLogout} style={outlineButtonStyle}>
            ログアウト
          </button>
        </div>
      </header>

      <form onSubmit={handlePost} style={{ padding: "16px 0", borderBottom: "1px solid #e1e4e8" }}>
        <textarea
          placeholder="いまなにしてる？"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={280}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 16,
            resize: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 13, color: content.length > 260 ? "red" : "#888" }}>
            {content.length}/280
          </span>
          <button type="submit" disabled={posting || !content.trim()} style={primaryButtonStyle}>
            {posting ? "投稿中..." : "つぶやく"}
          </button>
        </div>
      </form>

      <div>
        {posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", marginTop: 40 }}>
            まだ投稿がないばい。最初のつぶやきを！
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                padding: "16px 0",
                borderBottom: "1px solid #e1e4e8",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#555", fontWeight: "bold" }}>
                  {post.user_email || "unknown"}
                </span>
                <span style={{ fontSize: 12, color: "#999" }}>
                  {new Date(post.created_at).toLocaleString("ja-JP")}
                </span>
              </div>
              <p style={{ margin: "4px 0", fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                {post.content}
              </p>
              {post.user_id === user?.id && (
                <button
                  onClick={() => handleDelete(post.id)}
                  style={{ marginTop: 4, fontSize: 12, color: "#e0245e", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  削除
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 20px",
  backgroundColor: "#1d9bf0",
  color: "white",
  border: "none",
  borderRadius: 24,
  fontSize: 15,
  fontWeight: "bold",
  cursor: "pointer",
};

const outlineButtonStyle: React.CSSProperties = {
  padding: "6px 14px",
  backgroundColor: "white",
  color: "#1d9bf0",
  border: "1px solid #1d9bf0",
  borderRadius: 24,
  fontSize: 14,
  cursor: "pointer",
};
