# Bangla PDF Pro V2

Practical PDF overlay editor for personal document work.

## What this version can do
- Upload PDF
- Preview all pages
- Add Bangla/English text overlays
- Add white patches to cover old text
- Add signature/image overlays
- Drag, resize, edit items
- Export edited PDF

## Important limitation
This version does **not** truly rewrite internal text objects or preserve embedded original PDF fonts automatically.
It works by placing new layers on top of the PDF, which is practical for certificates, applications, forms, invoices, and similar edits.

## Run
```bash
npm install
npm run dev
```

Open:
```bash
http://localhost:3000
```
