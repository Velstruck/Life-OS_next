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

export async function GET(req: NextRequest) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [memories, total] = await Promise.all([
      Memory.find({ userId: userPayload.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Memory.countDocuments({ userId: userPayload.userId }),
    ]);

    return NextResponse.json({
      memories: memories.map((m: any) => ({
        id: m._id,
        userId: m.userId,
        title: m.title,
        content: m.content,
        images: m.images,
        category: m.category,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get memories error:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'life-os/memories',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result?.secure_url as string);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const authResponse = authenticateToken(req);
    if (authResponse instanceof NextResponse) return authResponse;
    const userPayload = authResponse;

    await connectDB();

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const imageFiles = formData.getAll('images') as File[];
    
    // Max 6 images
    const imagesToUpload = imageFiles.slice(0, 6);
    const imageUrls = await Promise.all(
      imagesToUpload.map(file => uploadToCloudinary(file))
    );

    const memory = new Memory({
      userId: userPayload.userId,
      title: title || '',
      content,
      images: imageUrls,
      category: category || 'memory',
    });

    await memory.save();

    return NextResponse.json({
      memory: {
        id: memory._id,
        userId: memory.userId,
        title: memory.title,
        content: memory.content,
        images: memory.images,
        category: memory.category,
        createdAt: memory.createdAt,
        updatedAt: memory.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create memory error:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
