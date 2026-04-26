-- X-hu 用 Supabase テーブルセットアップ
-- Supabase ダッシュボード > SQL Editor で実行してください

-- posts テーブル
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS（Row Level Security）を有効化
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 全員が投稿を読める
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT
  USING (true);

-- ログイン済みユーザーのみ投稿できる
CREATE POLICY "Auth users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分の投稿のみ削除できる
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
