import { NextRequest, NextResponse } from 'next/server';
import { resourceDb, sessionDb } from '@/lib/db/database';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const allowedFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.hancom.hwp',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const maxFileSize = 50 * 1024 * 1024; // 50MB

async function getAuthenticatedUser(request: NextRequest) {
  const cookies = request.headers.get('cookie');
  if (!cookies) return null;

  const tokenMatch = cookies.match(/auth-token=([^;]+)/);
  if (!tokenMatch) return null;

  const sessionToken = tokenMatch[1];
  const session = sessionDb.findByToken(sessionToken);

  return session || null;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;

    // Validation
    if (!file || !title || !category) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    // Generate unique filename with original extension
    const fileExtension = file.name.split('.').pop() || 'bin';
    const uniqueFilename = `${Date.now()}-${randomUUID()}.${fileExtension}`;
    const storagePath = `resources/${uniqueFilename}`;

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resources')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `파일 업로드 실패: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL (for reference, but we'll use signed URLs for downloads)
    const { data: { publicUrl } } = supabase.storage
      .from('resources')
      .getPublicUrl(storagePath);

    // Save to database using resourceDb
    const resource = await resourceDb.create({
      title: title.trim(),
      description: description?.trim() || undefined,
      category: category,
      fileName: file.name,
      filePath: storagePath, // Store the storage path instead of local path
      fileSize: file.size,
      fileType: file.type,
      uploadedBy: user.id
    });

    return NextResponse.json(
      {
        message: '자료가 성공적으로 업로드되었습니다.',
        resource: {
          id: resource.id,
          title: resource.title,
          category: resource.category,
          fileName: resource.file_name,
          filePath: resource.file_path
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: `업로드 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
