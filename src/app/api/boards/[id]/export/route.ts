import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BoardService } from '@/lib/services/board-service';
import { DocxExporter } from '@/lib/export/docx-exporter';
import { PdfExporter } from '@/lib/export/pdf-exporter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { format } = await request.json();

    if (!['docx', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format. Use docx or pdf' }, { status: 400 });
    }

    const board = await BoardService.getById(id);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const tasks = JSON.parse(board.content || '[]');
    const boardData = {
      title: board.title,
      tasks,
      createdAt: new Date(board.created_at).toLocaleDateString(),
      userName: user.email?.split('@')[0] || 'User',
    };

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'docx') {
      buffer = await DocxExporter.export(boardData);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `${board.title.replace(/[^a-z0-9]/gi, '_')}.docx`;
    } else {
      buffer = await PdfExporter.export(boardData);
      contentType = 'application/pdf';
      filename = `${board.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    }

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
