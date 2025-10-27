import { NextRequest, NextResponse } from 'next/server';
import { resourceDb } from '@/lib/db/database';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = parseInt(params.id);

    if (isNaN(resourceId)) {
      return NextResponse.json(
        { error: '잘못된 자료 ID입니다.' },
        { status: 400 }
      );
    }

    // Find resource from database
    const resource = await resourceDb.findById(resourceId);
    if (!resource) {
      return NextResponse.json(
        { error: '자료를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Increment download count
    await resourceDb.incrementDownloadCount(resourceId);

    // Generate signed URL from Supabase Storage (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('resources')
      .createSignedUrl(resource.file_path, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json(
        { error: '다운로드 링크 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Redirect to signed URL for secure download
    return NextResponse.redirect(signedUrlData.signedUrl);

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: `다운로드 중 오류가 발생했습니다: ${error.message}` },
      { status: 500 }
    );
  }
}
