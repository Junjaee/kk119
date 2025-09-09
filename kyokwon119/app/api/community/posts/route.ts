import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - 커뮤니티 글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("community_posts")
      .select(`
        *,
        profiles:author_id (
          id,
          username,
          avatar_url
        ),
        community_comments (count),
        community_likes (count)
      `, { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      posts: data,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST - 새 글 작성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      title,
      content,
      category,
      tags,
      allow_comment = true,
      is_notice = false,
      disallow_best = false,
      disallow_bestcomment = false,
      disallow_copy = false,
      disable_notification = false,
      attachments = []
    } = body;

    // 글 생성
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        title,
        content,
        category,
        tags,
        author_id: user.id,
        allow_comment,
        is_notice,
        disallow_best,
        disallow_bestcomment,
        disallow_copy,
        disable_notification,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        status: 'published'
      })
      .select()
      .single();

    if (postError) throw postError;

    // 첨부파일 처리
    if (attachments.length > 0) {
      const attachmentData = attachments.map((file: any) => ({
        post_id: post.id,
        file_url: file.url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      }));

      const { error: attachmentError } = await supabase
        .from("community_attachments")
        .insert(attachmentData);

      if (attachmentError) {
        console.error("Attachment error:", attachmentError);
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// PUT - 글 수정
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 작성자 확인
    const { data: existingPost } = await supabase
      .from("community_posts")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existingPost || existingPost.author_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // 글 업데이트
    const { data, error } = await supabase
      .from("community_posts")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}