import { NextRequest, NextResponse } from 'next/server';
import Memory from '@/lib/models/Memory';
import connectDB from '@/lib/db';
import { authenticateToken } from '@/lib/middleware/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string  }> }) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;

    await connectDB();
    const id = (await params).id;

    const memory = await Memory.findOne({ _id: id, userId: userPayload.userId });

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    for (const url of memory.images) {
      try {
        const parts = url.split('/');
        const folderIdx = parts.indexOf('life-os');
        if (folderIdx !== -1) {
          const publicId = parts
            .slice(folderIdx)
            .join('/')
            .replace(/\.[^/.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        // best-effort cleanup
      }
    }

    await memory.deleteOne();
    return NextResponse.json({ message: 'Memory deleted' });
  } catch (error) {
    console.error('Delete memory error:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
