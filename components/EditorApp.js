'use client';

import { useMemo, useRef, useState } from 'react';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PAGE_WIDTH = 850;
const fontOptions = [
  'Arial',
  'Noto Sans Bengali',
  'Hind Siliguri',
  'SolaimanLipi',
  'Kalpurush',
  'Siyam Rupali',
  'Vrinda'
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function svgToPngBytes(svgString, width, height) {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(width));
        canvas.height = Math.max(1, Math.ceil(height));
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const bytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        URL.revokeObjectURL(url);
        resolve(bytes);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function TextLayerItem({ item, onSelect, selected, onMove }) {
  const dragRef = useRef(null);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect(item.id);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      x: item.x,
      y: item.y
    };
    const handleMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onMove(item.id, {
        x: Math.max(0, dragRef.current.x + dx),
        y: Math.max(0, dragRef.current.y + dy)
      });
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div
      className="overlayText"
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        minHeight: item.height,
        fontSize: item.fontSize,
        fontFamily: item.fontFamily,
        color: item.color,
        background: selected ? 'rgba(255,255,255,0.6)' : 'transparent',
        outline: selected ? '2px solid rgba(15,118,110,0.5)' : 'none',
        padding: '2px 4px'
      }}
    >
      {item.text}
    </div>
  );
}

function PatchLayerItem({ item, onSelect, selected, onMove }) {
  const dragRef = useRef(null);
  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect(item.id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, x: item.x, y: item.y };
    const handleMove = (ev) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onMove(item.id, { x: Math.max(0, dragRef.current.x + dx), y: Math.max(0, dragRef.current.y + dy) });
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div
      className="patchBox"
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        outline: selected ? '2px solid rgba(220,38,38,0.6)' : 'none'
      }}
    />
  );
}

function ImageLayerItem({ item, onSelect, selected, onMove }) {
  const dragRef = useRef(null);
  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect(item.id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, x: item.x, y: item.y };
    const handleMove = (ev) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onMove(item.id, { x: Math.max(0, dragRef.current.x + dx), y: Math.max(0, dragRef.current.y + dy) });
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <img
      src={item.src}
      alt="overlay"
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        objectFit: 'contain',
        cursor: 'move',
        outline: selected ? '2px solid rgba(37,99,235,0.6)' : 'none',
        background: 'transparent'
      }}
    />
  );
}

export default function EditorApp() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [textItems, setTextItems] = useState([]);
  const [patchItems, setPatchItems] = useState([]);
  const [imageItems, setImageItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('Upload a PDF to start editing');
  const [exporting, setExporting] = useState(false);
  const [draft, setDraft] = useState({
    text: 'নতুন লেখা লিখুন',
    fontSize: 28,
    fontFamily: 'Noto Sans Bengali',
    color: '#000000',
    width: 280,
    height: 50,
    patchWidth: 180,
    patchHeight: 34,
    imageWidth: 160,
    imageHeight: 80
  });

  const selectedItem = useMemo(() => {
    return [...textItems, ...patchItems, ...imageItems].find((item) => item.id === selectedId) || null;
  }, [selectedId, textItems, patchItems, imageItems]);

  const pageTextItems = (page) => textItems.filter((item) => item.page === page);
  const pagePatchItems = (page) => patchItems.filter((item) => item.page === page);
  const pageImageItems = (page) => imageItems.filter((item) => item.page === page);

  const onPdfChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const bytes = await file.arrayBuffer();
    setPdfFile(file);
    setPdfBytes(bytes);
    setTextItems([]);
    setPatchItems([]);
    setImageItems([]);
    setSelectedId(null);
    setStatus('PDF loaded. Add white patch, Bangla text, signature, or image.');
  };

  const addText = () => {
    const item = {
      id: uid(),
      page: activePage,
      x: 80,
      y: 90,
      text: draft.text,
      fontSize: Number(draft.fontSize),
      fontFamily: draft.fontFamily,
      color: draft.color,
      width: Number(draft.width),
      height: Number(draft.height)
    };
    setTextItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setStatus('Text overlay added. Drag it on the page.');
  };

  const addPatch = () => {
    const item = {
      id: uid(),
      page: activePage,
      x: 80,
      y: 90,
      width: Number(draft.patchWidth),
      height: Number(draft.patchHeight)
    };
    setPatchItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setStatus('White patch added. Drag it over old text to cover it.');
  };

  const addImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    const item = {
      id: uid(),
      page: activePage,
      x: 100,
      y: 100,
      width: Number(draft.imageWidth),
      height: Number(draft.imageHeight),
      src,
      mimeType: file.type,
      fileName: file.name
    };
    setImageItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    setStatus('Image/signature added. Drag it to position.');
    event.target.value = '';
  };

  const updatePosition = (id, pos) => {
    setTextItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...pos } : item)));
    setPatchItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...pos } : item)));
    setImageItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...pos } : item)));
  };

  const updateSelected = (changes) => {
    if (!selectedId) return;
    setTextItems((prev) => prev.map((item) => (item.id === selectedId ? { ...item, ...changes } : item)));
    setPatchItems((prev) => prev.map((item) => (item.id === selectedId ? { ...item, ...changes } : item)));
    setImageItems((prev) => prev.map((item) => (item.id === selectedId ? { ...item, ...changes } : item)));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    setTextItems((prev) => prev.filter((item) => item.id !== selectedId));
    setPatchItems((prev) => prev.filter((item) => item.id !== selectedId));
    setImageItems((prev) => prev.filter((item) => item.id !== selectedId));
    setSelectedId(null);
  };

  const exportPdf = async () => {
    if (!pdfBytes) return;
    try {
      setExporting(true);
      setStatus('Building edited PDF...');
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
        const pageNo = pageIndex + 1;
        const page = pages[pageIndex];
        const { width, height } = page.getSize();
        const scale = width / PAGE_WIDTH;

        for (const patch of pagePatchItems(pageNo)) {
          page.drawRectangle({
            x: patch.x * scale,
            y: height - (patch.y + patch.height) * scale,
            width: patch.width * scale,
            height: patch.height * scale,
            color: rgb(1, 1, 1)
          });
        }

        for (const text of pageTextItems(pageNo)) {
          const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${text.width}" height="${text.height}">
              <foreignObject x="0" y="0" width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml" style="width:${text.width}px;height:${text.height}px;display:flex;align-items:flex-start;justify-content:flex-start;overflow:hidden;background:transparent;font-family:${escapeXml(text.fontFamily)};font-size:${text.fontSize}px;line-height:1.2;color:${escapeXml(text.color)};white-space:pre-wrap;">${escapeXml(text.text)}</div>
              </foreignObject>
            </svg>`;
          const pngBytes = await svgToPngBytes(svg, text.width, text.height);
          const png = await pdfDoc.embedPng(pngBytes);
          page.drawImage(png, {
            x: text.x * scale,
            y: height - (text.y + text.height) * scale,
            width: text.width * scale,
            height: text.height * scale
          });
        }

        for (const image of pageImageItems(pageNo)) {
          const bytes = await fetch(image.src).then((r) => r.arrayBuffer());
          const embedded = image.mimeType === 'image/png' ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
          page.drawImage(embedded, {
            x: image.x * scale,
            y: height - (image.y + image.height) * scale,
            width: image.width * scale,
            height: image.height * scale,
            rotate: degrees(0)
          });
        }
      }

      const output = await pdfDoc.save();
      downloadBlob(new Blob([output], { type: 'application/pdf' }), `edited-${pdfFile?.name || 'document.pdf'}`);
      setStatus('Edited PDF downloaded successfully.');
    } catch (error) {
      console.error(error);
      setStatus('Export failed. Try a smaller file or PNG/JPG image.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="topbar">
        <div className="brand">
          <h1>Bangla PDF Pro V2</h1>
          <p>Practical overlay editor for Bangla and English PDFs</p>
        </div>
        <div className="badge">Usable for personal document edits</div>
      </div>

      <div className="hero">
        <span className="badge">Version 2</span>
        <h2>Upload PDF → cover old text → add new Bangla text → export PDF</h2>
        <p>{status}</p>
      </div>

      <div className="grid">
        <div className="panel">
          <h3>Editing tools</h3>
          <div className="notice">
            This version is practical for your own work. It does overlay editing, not true internal font replacement.
          </div>

          <div className="field">
            <label>Upload PDF</label>
            <input type="file" accept="application/pdf" onChange={onPdfChange} />
          </div>

          <div className="field">
            <label>Active page</label>
            <select value={activePage} onChange={(e) => setActivePage(Number(e.target.value))}>
              {Array.from({ length: numPages || 1 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Page {i + 1}</option>
              ))}
            </select>
          </div>

          <div className="smallTitle">Add Bangla / English text</div>
          <div className="field">
            <label>Text</label>
            <textarea rows="4" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          </div>
          <div className="row">
            <div className="field">
              <label>Font size</label>
              <input type="number" value={draft.fontSize} onChange={(e) => setDraft({ ...draft, fontSize: e.target.value })} />
            </div>
            <div className="field">
              <label>Font</label>
              <select value={draft.fontFamily} onChange={(e) => setDraft({ ...draft, fontFamily: e.target.value })}>
                {fontOptions.map((font) => <option key={font}>{font}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Text box width</label>
              <input type="number" value={draft.width} onChange={(e) => setDraft({ ...draft, width: e.target.value })} />
            </div>
            <div className="field">
              <label>Text box height</label>
              <input type="number" value={draft.height} onChange={(e) => setDraft({ ...draft, height: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Color</label>
            <input type="text" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="#000000" />
          </div>
          <button className="btn" onClick={addText}>Add text overlay</button>

          <hr style={{ margin: '18px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />

          <div className="smallTitle">White patch tool</div>
          <div className="row">
            <div className="field">
              <label>Patch width</label>
              <input type="number" value={draft.patchWidth} onChange={(e) => setDraft({ ...draft, patchWidth: e.target.value })} />
            </div>
            <div className="field">
              <label>Patch height</label>
              <input type="number" value={draft.patchHeight} onChange={(e) => setDraft({ ...draft, patchHeight: e.target.value })} />
            </div>
          </div>
          <button className="btn secondary" onClick={addPatch}>Add white patch</button>

          <hr style={{ margin: '18px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />

          <div className="smallTitle">Signature / image</div>
          <div className="row">
            <div className="field">
              <label>Image width</label>
              <input type="number" value={draft.imageWidth} onChange={(e) => setDraft({ ...draft, imageWidth: e.target.value })} />
            </div>
            <div className="field">
              <label>Image height</label>
              <input type="number" value={draft.imageHeight} onChange={(e) => setDraft({ ...draft, imageHeight: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <input type="file" accept="image/png,image/jpeg" onChange={addImage} />
          </div>

          <hr style={{ margin: '18px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />

          <div className="smallTitle">Selected item</div>
          {!selectedItem && <p className="hint">Click any overlay on the page to edit or delete it.</p>}
          {selectedItem && (
            <>
              {'text' in selectedItem && (
                <>
                  <div className="field">
                    <label>Selected text</label>
                    <textarea rows="3" value={selectedItem.text} onChange={(e) => updateSelected({ text: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>X</label>
                      <input type="number" value={selectedItem.x} onChange={(e) => updateSelected({ x: Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>Y</label>
                      <input type="number" value={selectedItem.y} onChange={(e) => updateSelected({ y: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>Width</label>
                      <input type="number" value={selectedItem.width} onChange={(e) => updateSelected({ width: Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>Height</label>
                      <input type="number" value={selectedItem.height} onChange={(e) => updateSelected({ height: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>Font size</label>
                      <input type="number" value={selectedItem.fontSize} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>Font</label>
                      <select value={selectedItem.fontFamily} onChange={(e) => updateSelected({ fontFamily: e.target.value })}>
                        {fontOptions.map((font) => <option key={font}>{font}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {!('text' in selectedItem) && !('src' in selectedItem) && (
                <>
                  <div className="row">
                    <div className="field">
                      <label>X</label>
                      <input type="number" value={selectedItem.x} onChange={(e) => updateSelected({ x: Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>Y</label>
                      <input type="number" value={selectedItem.y} onChange={(e) => updateSelected({ y: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>Width</label>
                      <input type="number" value={selectedItem.width} onChange={(e) => updateSelected({ width: Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>Height</label>
                      <input type="number" value={selectedItem.height} onChange={(e) => updateSelected({ height: Number(e.target.value) })} />
                    </div>
                  </div>
                </>
              )}

              {'src' in selectedItem && (
                <>
                  <div className="row">
                    <div className="field">
                      <label>X</label>
                      <input type="number" value={selectedItem.x} onChange={(e) => updateSelected({ x: Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>Y</label>
                      <input type="number" value={selectedItem.y} onChange={(e) => updateSelected({ y: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="field">
                      <label>Width</label>
                      <input type="number" value={selectedItem.width} onChange={(e) => updateSelected({ width: Number(e.target.value) })} />
                    </div>
                    <div className="field">
                      <label>Height</label>
                      <input type="number" value={selectedItem.height} onChange={(e) => updateSelected({ height: Number(e.target.value) })} />
                    </div>
                  </div>
                </>
              )}

              <button className="btn danger" onClick={removeSelected}>Delete selected item</button>
            </>
          )}

          <hr style={{ margin: '18px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />
          <button className="btn" onClick={exportPdf} disabled={!pdfBytes || exporting}>
            {exporting ? 'Exporting...' : 'Download edited PDF'}
          </button>
          <p className="hint" style={{ marginTop: 10 }}>
            Best for certificates, forms, invoices, applications, CVs, and small Bangla text changes.
          </p>
        </div>

        <div className="viewerWrap">
          {!pdfFile && <p className="hint">No PDF uploaded yet.</p>}
          {pdfFile && (
            <Document
              file={pdfFile}
              onLoadSuccess={({ numPages: totalPages }) => {
                setNumPages(totalPages);
                setActivePage(1);
              }}
              loading={<p>Loading PDF...</p>}
              error={<p>Failed to load PDF preview.</p>}
            >
              {Array.from({ length: numPages }, (_, index) => {
                const pageNo = index + 1;
                return (
                  <div key={pageNo} className="canvasPage" onClick={() => { setActivePage(pageNo); setSelectedId(null); }}>
                    <Page
                      pageNumber={pageNo}
                      width={PAGE_WIDTH}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />
                    {pagePatchItems(pageNo).map((item) => (
                      <PatchLayerItem
                        key={item.id}
                        item={item}
                        selected={item.id === selectedId}
                        onSelect={setSelectedId}
                        onMove={updatePosition}
                      />
                    ))}
                    {pageTextItems(pageNo).map((item) => (
                      <TextLayerItem
                        key={item.id}
                        item={item}
                        selected={item.id === selectedId}
                        onSelect={setSelectedId}
                        onMove={updatePosition}
                      />
                    ))}
                    {pageImageItems(pageNo).map((item) => (
                      <ImageLayerItem
                        key={item.id}
                        item={item}
                        selected={item.id === selectedId}
                        onSelect={setSelectedId}
                        onMove={updatePosition}
                      />
                    ))}
                  </div>
                );
              })}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
