import { NextRequest, NextResponse } from "next/server";
import { communityDb } from "@/lib/db/database";

// GET - 커뮤니티 글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    // communityDb를 사용하여 글 목록 조회
    const filters: any = {};

    if (category && category !== "all") {
      filters.category = category;
    }

    if (search) {
      filters.search = search;
    }

    const allPosts = await communityDb.findAll(filters);

    // 페이지네이션 적용
    const offset = (page - 1) * limit;
    const paginatedPosts = allPosts.slice(offset, offset + limit);

    return NextResponse.json({
      posts: paginatedPosts,
      totalCount: allPosts.length,
      page,
      limit,
      totalPages: Math.ceil(allPosts.length / limit)
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
    const body = await request.json();

    const {
      title,
      content,
      category,
      author,
      authorId,
    } = body;

    // 필수 필드 검증
    if (!title || !content || !category || !author || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, category, author, authorId" },
        { status: 400 }
      );
    }

    // UUID 생성
    const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // communityDb를 사용하여 글 작성
    const newPost = await communityDb.create({
      id,
      title,
      content,
      author,
      author_id: authorId,
      category,
    });

    return NextResponse.json(newPost, { status: 201 });
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
    const body = await request.json();
    const { id, title, content, category, authorId } = body;

    // 필수 필드 검증
    if (!id) {
      return NextResponse.json(
        { error: "Missing post ID" },
        { status: 400 }
      );
    }

    if (!authorId) {
      return NextResponse.json(
        { error: "Missing author ID" },
        { status: 401 }
      );
    }

    // 작성자 확인
    const existingPost = await communityDb.findById(id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (existingPost.author_id !== authorId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // communityDb를 사용하여 글 수정
    const updatedPost = await communityDb.update(id, {
      title,
      content,
      category,
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
