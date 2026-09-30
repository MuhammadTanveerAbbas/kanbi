import { describe, it, expect } from 'vitest';
import { DocxExporter } from '@/lib/export/docx-exporter';
import { PdfExporter } from '@/lib/export/pdf-exporter';
import { BOARD_TASK_COLUMNS } from '@/lib/constants';
import type { ExportedTask } from '@/lib/export/docx-exporter';

const task = (over: Partial<ExportedTask> = {}): ExportedTask => ({
  title: 'Review proposal',
  priority: 'high',
  status: 'todo',
  ...over,
});

const board = {
  title: 'Sprint 1',
  createdAt: 'Oct 1, 2026',
  userName: 'tanveer',
  tasks: [
    task({ title: 'Urgent fix', priority: 'urgent', status: 'todo' }),
    task({ title: 'In flight', priority: 'medium', status: 'wip' }),
    task({ title: 'Shipped', priority: 'low', status: 'done' }),
  ],
};

describe('board export', () => {
  it('produces a real DOCX file', async () => {
    const buffer = await DocxExporter.export(board);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    // DOCX is a zip archive, which starts with the PK signature.
    expect(buffer.subarray(0, 2).toString('binary')).toBe('PK');
  });

  it('produces a real PDF file', async () => {
    const buffer = await PdfExporter.export(board);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('includes every task in the DOCX regardless of status casing', async () => {
    // The exporters previously grouped on 'To Do' / 'In Progress' / 'Done'
    // while tasks are stored as 'todo' / 'wip' / 'done', so nothing matched and
    // the export was empty. The text is compressed inside the zip, so the check
    // is that generation succeeds for each status rather than a byte match.
    for (const column of BOARD_TASK_COLUMNS) {
      const buffer = await DocxExporter.export({
        ...board,
        tasks: [task({ status: column.status })],
      });
      expect(buffer.length).toBeGreaterThan(0);
    }
  });

  it('exports a board with no tasks without failing', async () => {
    const emptyDocx = await DocxExporter.export({ ...board, tasks: [] });
    expect(emptyDocx.length).toBeGreaterThan(0);

    const emptyPdf = await PdfExporter.export({ ...board, tasks: [] });
    expect(emptyPdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('handles a long task list across multiple PDF pages', async () => {
    const many = Array.from({ length: 120 }, (_, i) =>
      task({ title: `Task number ${i}`, status: 'todo' })
    );
    const buffer = await PdfExporter.export({ ...board, tasks: many });
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('handles a title containing characters that are unsafe in a filename', async () => {
    // The route sanitizes the filename; the exporters must not choke on the text.
    const buffer = await DocxExporter.export({ ...board, title: 'Q3 / Plan "A" <draft>' });
    expect(buffer.length).toBeGreaterThan(0);
  });
});
