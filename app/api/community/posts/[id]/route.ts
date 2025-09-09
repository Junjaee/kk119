import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - 특정 글 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // 조회수 증가
    await supabase.rpc("increment_view_count", { post_id: params.id });

    // 글 조회
    const { data, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          avatar_url
        ),
        community_attachments (
          id,
          file_url,
          file_name,
          file_size,
          file_type
        ),
        community_comments (
          id,
          content,
          created_at,
          author_id,
          profiles:author_id (
            id,
            username,
            avatar_url
          )
        ),
        community_likes (
          user_id
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// DELETE - 글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 작성자 확인
    const { data: post } = await supabase
      .from("community_posts")
      .select("author_id")
      .eq("id", params.id)
      .single();

    if (!post || post.author_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // 글 삭제 (연관 데이터는 CASCADE로 자동 삭제)
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}