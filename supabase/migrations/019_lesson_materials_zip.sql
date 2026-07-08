-- ============================================================
-- YordamchiAI — Migration 019: Lesson materials — ZIP + 20 MB limit
--
-- lesson-attachments bucket'iga:
--   • ZIP fayl turlarini qo'shadi (application/zip, x-zip-compressed)
--   • fayl hajmi chegarasini 20 MB ga tenglashtiradi (mijoz tomoni bilan bir xil)
--
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

UPDATE storage.buckets
SET
  file_size_limit    = 20971520, -- 20 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
WHERE id = 'lesson-attachments';
