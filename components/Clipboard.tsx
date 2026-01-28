
import React, { useState, useRef, useEffect } from 'react';
import { User, DocType, GenerationConfig, GeneratedContent } from '../types';
import { X, ChevronRight, Download, FileText, Share2, Menu, Paperclip, BookOpen, Printer, Maximize, Minimize, FileCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ClipboardProps {
  user: User;
  onBack: () => void;
  onGenerate: (config: GenerationConfig) => Promise<GeneratedContent | null>;
  initialDoc?: GeneratedContent | null;
  // Added lang prop to fix the reported TypeScript error in App.tsx
  lang: 'en' | 'fr' | 'es';
}

export const Clipboard = ({ user, onBack, onGenerate, initialDoc, lang }: ClipboardProps) => {
  const [docType, setDocType] = useState<DocType>('expose');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [scale, setScale] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previousWidth = useRef<number>(window.innerWidth);

  // Form States
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [currency, setCurrency] = useState('XAF');
  const [bwPrice, setBwPrice] = useState(25);
  const [colorPrice, setColorPrice] = useState(100);
  const [budget, setBudget] = useState(1000);
  const [school, setSchool] = useState('');
  const [country, setCountry] = useState('');
  const [professor, setProfessor] = useState('');
  const [date, setDate] = useState('');
  const [objectives, setObjectives] = useState('');
  
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [countryEmblem, setCountryEmblem] = useState<string | null>(null);
  const schoolInputRef = useRef<HTMLInputElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);

  const [citation, setCitation] = useState('');
  const [instructions, setInstructions] = useState('');
  const [pageCount, setPageCount] = useState(3);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDoc) {
      setResult(initialDoc);
      setIsSidebarOpen(false); 
    }
  }, [initialDoc]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullScreen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const handleLayout = () => {
        const width = window.innerWidth;
        if (width !== previousWidth.current) {
            setIsSidebarOpen(width >= 768);
            previousWidth.current = width;
        }
        setScale(width < 768 ? Math.min((width - 32) / 794, 1) : 1);
    };
    handleLayout();
    window.addEventListener('resize', handleLayout);
    return () => window.removeEventListener('resize', handleLayout);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => setter(ev.target?.result as string);
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleGenerateClick = async () => {
    setLoading(true);
    const config: GenerationConfig = {
        type: docType, topic, level, currency, bwPrice, colorPrice, budget, school, country, professor, date,
        citation, instructions, pageCount, objectives,
        userApiKey: user.customApiKey 
    };
    try {
        const doc = await onGenerate(config);
        if (doc) {
            if (doc.content.cover) {
                if (schoolLogo) doc.content.cover.schoolLogo = schoolLogo;
                if (countryEmblem) doc.content.cover.countrySymbol = countryEmblem;
            }
            setResult(doc);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }
    } catch (e: any) {
        alert(e.message || "Error de generación");
    } finally {
        setLoading(false);
    }
  };

  const downloadPDF = async () => {
      if (!reportRef.current || !result) return;
      try {
          const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
          const sections = reportRef.current.querySelectorAll('.pdf-section');
          for (let i = 0; i < sections.length; i++) {
              if (i > 0) pdf.addPage();
              const canvas = await html2canvas(sections[i] as HTMLElement, { scale: 2, useCORS: true });
              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
          }
          pdf.save(`WyRunner-${result.title}.pdf`);
      } catch (err) { alert("Error al crear PDF."); }
  };

  const downloadWord = () => {
      if (!reportRef.current || !result) return;
      
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>" +
                     "<head><meta charset='utf-8'><style>body { font-family: 'Times New Roman'; } .pdf-section { page-break-after: always; }</style></head><body>";
      const footer = "</body></html>";
      const content = reportRef.current.innerHTML;
      
      const cleanContent = content.replace(/class="[^"]*"/g, (match) => {
          if (match.includes('pdf-section')) return 'class="pdf-section"';
          return '';
      });

      const blob = new Blob(['\ufeff', header + cleanContent + footer], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `WyRunner-${result.title}.doc`;
      link.click();
      URL.revokeObjectURL(url);
  };

  const PageHeader = ({ title, sub }: { title: string, sub?: string }) => (
      <div className="absolute top-0 left-0 w-full h-24 px-12 pt-8 flex justify-between items-end border-b border-gray-200">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-sans font-bold">{sub || "WyRunner Studio"}</div>
          <div className="text-sm font-bold text-gray-700 font-serif italic truncate max-w-[300px]">{title}</div>
      </div>
  );

  const PageFooter = ({ pageNum }: { pageNum?: number | string }) => (
      <div className="absolute bottom-0 left-0 w-full h-16 px-12 pb-6 flex justify-between items-center border-t border-gray-100">
          <div className="text-[10px] text-gray-300 font-sans tracking-wide">Generated by WyRunner AI</div>
          {pageNum && <div className="text-sm font-serif text-gray-600 font-bold">- {pageNum} -</div>}
      </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      {/* Top Mobile Bar */}
      {!isFullScreen && (
        <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 z-30">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2"><Menu /></button>
            <span className="font-bold truncate max-w-[150px]">{result ? result.title : 'WyRunner Studio'}</span>
            <button onClick={onBack} className="p-2 text-red-500"><X size={18} /></button>
        </div>
      )}

      {/* Configuration Sidebar */}
      {!isFullScreen && (
        <aside className={`absolute md:relative top-0 left-0 h-full w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-20 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'} pt-14 md:pt-0`}>
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-bold text-lg dark:text-white">Configuración</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 rounded-full"><ChevronRight size={20} /></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto pb-20">
                <div className="grid grid-cols-2 gap-2">
                    {['expose', 'these', 'dissertation', 'argumentation'].map((t) => (
                        <button 
                          key={t} 
                          onClick={() => setDocType(t as DocType)} 
                          className={`px-2 py-2 rounded text-[10px] font-bold uppercase transition-colors ${docType === t ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                        >
                          {t}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                  <input 
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    placeholder={docType === 'dissertation' ? "Cita / Sujeto" : "Tema / Título"} 
                    value={topic} 
                    onChange={e => setTopic(e.target.value)} 
                  />
                  
                  <textarea 
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm h-16" 
                    placeholder={docType === 'expose' ? "Objetivos (ex: Convencer sobre ecología...)" : "Instrucciones o contexto..."} 
                    value={docType === 'dissertation' ? instructions : objectives} 
                    onChange={e => docType === 'dissertation' ? setInstructions(e.target.value) : setObjectives(e.target.value)} 
                  />

                  {(docType === 'expose' || docType === 'these') && (
                    <>
                      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={docType === 'these' ? "Dominio (ex: Derecho...)" : "Nivel de estudio"} value={level} onChange={e => setLevel(e.target.value)} />
                      
                      <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                              <label className="text-[10px] text-gray-400">Presupuesto</label>
                              <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value))} />
                          </div>
                          <div className="flex flex-col">
                              <label className="text-[10px] text-gray-400">Divisa</label>
                              <select value={currency} onChange={e => setCurrency(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                  <option value="XAF">XAF</option>
                                  <option value="EUR">EUR</option>
                                  <option value="USD">USD</option>
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                              <label className="text-[10px] text-gray-400">Precio B/N</label>
                              <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" type="number" value={bwPrice} onChange={e => setBwPrice(parseFloat(e.target.value))} />
                          </div>
                          <div className="flex flex-col">
                              <label className="text-[10px] text-gray-400">Precio Color</label>
                              <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" type="number" value={colorPrice} onChange={e => setColorPrice(parseFloat(e.target.value))} />
                          </div>
                      </div>

                      <div className="relative">
                          <input className="w-full p-2 pr-10 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={docType === 'these' ? "Universidad / Institución" : "Institución"} value={school} onChange={e => setSchool(e.target.value)} />
                          <button onClick={() => schoolInputRef.current?.click()} className="absolute right-2 top-2 text-gray-400 hover:text-purple-600">
                              {schoolLogo ? <span className="text-green-500 font-bold text-[10px]">IMG</span> : <Paperclip size={18} />}
                          </button>
                          <input type="file" ref={schoolInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setSchoolLogo)} />
                      </div>

                      <div className="relative">
                          <input className="w-full p-2 pr-10 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="País" value={country} onChange={e => setCountry(e.target.value)} />
                          <button onClick={() => countryInputRef.current?.click()} className="absolute right-2 top-2 text-gray-400 hover:text-purple-600">
                              {countryEmblem ? <span className="text-green-500 font-bold text-[10px]">IMG</span> : <Paperclip size={18} />}
                          </button>
                          <input type="file" ref={countryInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCountryEmblem)} />
                      </div>

                      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={docType === 'these' ? "Director de tesis" : "Profesor"} value={professor} onChange={e => setProfessor(e.target.value)} />
                      <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Fecha (D/M/A)" value={date} onChange={e => setDate(e.target.value)} />
                    </>
                  )}

                  {(docType === 'dissertation' || docType === 'argumentation') && (
                    <>
                      <div className="flex flex-col">
                          <label className="text-[10px] text-gray-400">Páginas deseadas</label>
                          <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" type="number" value={pageCount} onChange={e => setPageCount(parseInt(e.target.value))} />
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={handleGenerateClick} 
                  disabled={loading || !topic} 
                  className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-all disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Generando...
                    </span>
                  ) : "Generar Documento"}
                </button>
            </div>
        </aside>
      )}

      {/* FIXED CLOSE BUTTON - Ensuring visibility for desktop users */}
      {!isFullScreen && (
          <button 
              onClick={onBack}
              className="fixed top-4 right-4 z-[100] flex items-center justify-center p-3 bg-white dark:bg-gray-800 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700 transition-all transform hover:scale-110"
              title="Cerrar WyRunner Studio"
          >
              <X size={24} />
          </button>
      )}

      <main className={`flex-1 overflow-y-auto flex justify-center bg-gray-100 dark:bg-gray-900 ${isFullScreen ? 'fixed inset-0 z-50 p-0' : 'pt-16 md:pt-4 p-4 md:p-8'}`}>
        {!result ? (
            <div className="flex flex-col items-center justify-center text-gray-400 text-center max-w-sm animate-fade-in py-20">
                <FileText size={80} className="mb-6 opacity-20" />
                <h3 className="text-xl font-bold mb-2">Editor Académico</h3>
                <p className="text-sm opacity-60 px-4">Configura los parámetros en la barra lateral y genera tu producción académica optimizada.</p>
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mt-6 px-6 py-2 bg-purple-600 text-white rounded-full font-bold">Abrir Configuración</button>
            </div>
        ) : (
            <div className="w-full flex justify-center items-start">
                 <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: '210mm' }} className="transition-transform duration-300">
                     {!isFullScreen && (
                         <div className="flex justify-between items-center mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-4 rounded-xl border dark:border-gray-700 shadow-sm">
                             <h2 className="font-bold text-lg dark:text-white truncate max-w-[200px]">{result.title}</h2>
                             <div className="flex gap-2">
                                <button onClick={() => setIsFullScreen(true)} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 transition-colors" title="Plein écran"><Maximize size={20} /></button>
                                <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all"><Download size={18} /> PDF</button>
                                <button onClick={downloadWord} className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-800 transition-all"><FileCode size={18} /> Word</button>
                             </div>
                         </div>
                     )}

                     {/* Document Preview Content */}
                     <div ref={reportRef} className="bg-white shadow-2xl text-black">
                         {result.content.cover && (
                             <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative flex flex-col justify-between">
                                 <div className="absolute inset-6 border-[3px] border-double border-gray-900 pointer-events-none"></div>
                                 <div className="flex justify-between items-start mt-8 mx-8 h-32 relative z-10">
                                    <div className="text-left w-1/3">{result.content.cover.countrySymbol?.startsWith('data:image') ? <img src={result.content.cover.countrySymbol} className="max-h-24 object-contain" /> : <div className="font-bold uppercase text-xs">{result.content.cover.countrySymbol}</div>}</div>
                                    <div className="text-right w-1/3 flex flex-col items-end">
                                        {result.content.cover.schoolLogo && <img src={result.content.cover.schoolLogo} className="max-h-24 object-contain" />}
                                        <div className="font-bold uppercase text-xs mt-2">{result.content.cover.schoolName}</div>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center items-center text-center px-16 relative z-10">
                                    <div className="mb-4 font-serif italic text-lg border-b pb-1 px-4">{result.content.cover.educationLevel}</div>
                                    <h1 className="text-4xl font-serif font-black mb-4 uppercase leading-tight">{result.content.cover.title}</h1>
                                    {result.content.cover.subtitle && <p className="text-xl font-serif italic text-gray-600">{result.content.cover.subtitle}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-8 text-left mb-16 mx-16 relative z-10">
                                    <div className="pl-4 border-l-4 border-gray-900"><p className="text-[8px] uppercase font-bold text-gray-500">Presentado por</p><p className="font-bold">{result.content.cover.studentName}</p></div>
                                    <div className="text-right pr-4 border-r-4 border-gray-900"><p className="text-[8px] uppercase font-bold text-gray-500">Director</p><p className="font-bold">{result.content.cover.professorName}</p></div>
                                </div>
                                <div className="text-center pb-8 font-serif italic text-gray-500">{result.content.cover.date}</div>
                             </div>
                         )}
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                             <PageHeader title={result.title} sub="Índice" /><div className="mt-20 px-8"><h2 className="text-2xl font-serif font-bold mb-8 text-center uppercase border-b pb-2">Índice</h2>
                             <div className="space-y-3">{result.content.toc?.map((item, i) => (<div key={i} className="flex justify-between items-baseline"><span>{item.title}</span><div className="flex-1 border-b border-dotted mx-2"></div><span>{item.page}</span></div>))}</div></div><PageFooter />
                         </div>
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                             <PageHeader title={result.title} sub="Introducción" /><div className="mt-20 px-8 text-justify leading-relaxed text-lg font-serif">{result.content.introduction}</div><PageFooter pageNum={1} />
                         </div>
                         {result.content.sections.map((sec, i) => (
                             <div key={i} className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                                 <PageHeader title={result.title} sub={`Parte ${i+1}`} /><div className="mt-20 px-8"><h3 className="text-2xl font-serif font-bold mb-4 uppercase border-b border-gray-100 pb-2">{sec.heading}</h3><p className="text-justify leading-relaxed text-lg font-serif">{sec.content}</p></div><PageFooter pageNum={i+2} />
                             </div>
                         ))}
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                             <PageHeader title={result.title} sub="Conclusión" /><div className="mt-20 px-8 text-justify leading-relaxed text-lg font-serif">{result.content.conclusion}</div><PageFooter pageNum={result.content.sections.length + 2} />
                         </div>
                     </div>
                 </div>
            </div>
        )}
        
        {/* Floating Close Button for Full Screen */}
        {isFullScreen && (
             <button 
                onClick={() => setIsFullScreen(false)}
                className="fixed top-6 right-6 z-[60] p-4 bg-black/60 text-white backdrop-blur-md rounded-full shadow-2xl hover:bg-black/80 transition-all border border-white/20"
                title="Quitter le plein écran"
            >
                <Minimize size={28} />
            </button>
        )}
      </main>
    </div>
  );
};
