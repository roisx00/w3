import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isPdf) {
            return NextResponse.json({ error: 'Only image or PDF files are allowed' }, { status: 400 });
        }

        const maxSize = isImage ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: `File must be under ${isImage ? '2MB' : '5MB'}` }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: isImage ? 'logos' : 'resumes',
                    resource_type: isImage ? 'image' : 'raw',
                    ...(isPdf ? { format: 'pdf' } : {}),
                    public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
                },
                (error, result) => {
                    if (error || !result) return reject(error ?? new Error('Upload failed'));
                    resolve(result as { secure_url: string });
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
