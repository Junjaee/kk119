import { NextRequest, NextResponse } from 'next/server';
import { resourceDb, sessionDb } from '@/lib/db/database';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resources');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    const relativeFilePath = `/uploads/resources/${uniqueFilename}`;

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const resource = resourceDb.create({
      title: title.trim(),
      description: description?.trim() || null,
      category: category,
      fileName: file.name,
      filePath: relativeFilePath,
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
          fileName: resource.fileName
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}