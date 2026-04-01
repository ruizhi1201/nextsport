import { NextRequest, NextResponse } from 'next/server';
import { createMobileClient, createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createMobileClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { fileName, contentType } = body;

    const filePath = `${user.id}/${Date.now()}-${fileName || 'swing.mp4'}`;

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient.storage
      .from('swing-videos')
      .createSignedUploadUrl(filePath);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      token: data.token,
      filePath,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
