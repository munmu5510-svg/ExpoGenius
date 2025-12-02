import React, { useState, useRef, useEffect } from 'react';
import { User, DocType, GenerationConfig, GeneratedContent } from '../types';
import { X, ChevronRight, Download, FileText, Printer, Share2, Menu } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ClipboardProps {
  user: User;
  onBack: () => void;
  onGenerate: (config: GenerationConfig) => Promise<GeneratedContent | null>;
  initialDoc?: GeneratedContent | null;
}

export const Clipboard = ({ user, onBack, onGenerate, initialDoc }: ClipboardProps) => {
  const [docType, setDocType] = useState<DocType>('expose');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Form States
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  // Exposé specific
  const [currency, setCurrency] = useState('€');
  const [bwPrice, setBwPrice] = useState(0.1);
  const [colorPrice, setColorPrice] = useState(0.5);
  const [budget, setBudget] = useState(5);
  const [school, setSchool] = useState('');
  const [country, setCountry] = useState('');
  const [professor, setProfessor] = useState('');
  const [date, setDate] = useState('');
  // Other
  const [citation, setCitation] = useState('');
  const [instructions, setInstructions] = useState('');
  const [pageCount, setPageCount] = useState(3);

  const reportRef = useRef<HTMLDivElement>(null);

  // Load initial document if provided (view mode)
  useEffect(() => {
    if (initialDoc) {
      setResult(initialDoc);
      setIsSidebarOpen(false); // Hide sidebar to show doc immediately
    }
  }, [initialDoc]);

  // Mobile responsiveness for sidebar
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGenerateClick = async () => {
    setLoading(true);
    const config: GenerationConfig = {
        type: docType,
        topic,
        level,
        currency, bwPrice, colorPrice, budget, school, country, professor, date,
        citation, instructions, pageCount
    };
    try {
        const doc = await onGenerate(config);
        if (doc) {
            setResult(doc);
            if (window.innerWidth < 768) setIsSidebarOpen(false); // Auto close on mobile
        }
    } catch (e) {
        alert("Erreur de génération");
    } finally {
        setLoading(false);
    }
  };

  const downloadPDF = async () => {
      if (!reportRef.current) return;
      
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 0; // Handled by CSS padding

      // Helper to capture element and add to PDF
      const addElementToPdf = async (element: HTMLElement, isFirstPage = false) => {
          if(!isFirstPage) pdf.addPage();

          const canvas = await html2canvas(element, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const imgHeight = (canvas.height * pageWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
      };

      try {
          // Select all section blocks specifically
          const sections = reportRef.current.querySelectorAll('.pdf-section');
          
          for (let i = 0; i < sections.length; i++) {
              await addElementToPdf(sections[i] as HTMLElement, i === 0);
          }

          pdf.save(`WordShelter-${result?.title || 'Document'}.pdf`);
      } catch (err) {
          console.error("PDF Error", err);
          alert("Erreur lors de la création du PDF.");
      }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 z-30">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
               <Menu />
           </button>
           <span className="font-bold">Clipboard</span>
           <button onClick={onBack} className="p-2 bg-red-50 text-red-500 rounded-full"><X size={18} /></button>
      </div>

      {/* Sidebar Configuration */}
      <aside className={`
          absolute md:relative top-0 left-0 h-full w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          flex flex-col z-20 transition-transform duration-300 transform 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}
          pt-14 md:pt-0
      `}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-lg dark:text-white">Configuration</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <ChevronRight size={20} />
            </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto pb-20">
            <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Type de production</label>
                <div className="flex gap-2">
                    <button onClick={() => setDocType('expose')} className={`px-3 py-1 rounded-md text-sm ${docType === 'expose' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>Exposé</button>
                    <button onClick={() => setDocType('dissertation')} className={`px-3 py-1 rounded-md text-sm ${docType === 'dissertation' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>Dissert.</button>
                    <button onClick={() => setDocType('argumentation')} className={`px-3 py-1 rounded-md text-sm ${docType === 'argumentation' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>Arg.</button>
                </div>
            </div>

            {/* Dynamic Forms */}
            {docType === 'expose' && (
                <>
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Thème" value={topic} onChange={e => setTopic(e.target.value)} />
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Niveau d'étude" value={level} onChange={e => setLevel(e.target.value)} />
                    <div className="grid grid-cols-2 gap-2">
                        <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Devise (€)" value={currency} onChange={e => setCurrency(e.target.value)} />
                        <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Budget" type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value))} />
                        <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Prix N&B" type="number" value={bwPrice} onChange={e => setBwPrice(parseFloat(e.target.value))} />
                        <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Prix Coul." type="number" value={colorPrice} onChange={e => setColorPrice(parseFloat(e.target.value))} />
                    </div>
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Établissement" value={school} onChange={e => setSchool(e.target.value)} />
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Pays" value={country} onChange={e => setCountry(e.target.value)} />
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Professeur" value={professor} onChange={e => setProfessor(e.target.value)} />
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Date (Ville/Mois/Année)" value={date} onChange={e => setDate(e.target.value)} />
                </>
            )}

            {(docType === 'dissertation' || docType === 'argumentation') && (
                <>
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder={docType === 'dissertation' ? "Citation / Sujet" : "Sujet"} value={topic} onChange={e => setTopic(e.target.value)} />
                    <textarea className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Consigne spécifique..." value={instructions} onChange={e => setInstructions(e.target.value)} />
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" type="number" placeholder="Nombre de pages" value={pageCount} onChange={e => setPageCount(parseInt(e.target.value))} />
                </>
            )}

            <button 
                onClick={handleGenerateClick}
                disabled={loading}
                className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading ? <span className="animate-spin">⌛</span> : "Générer"}
            </button>
        </div>
      </aside>

      {/* Main View / Preview */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-4 p-4 md:p-8 flex justify-center bg-gray-100 dark:bg-gray-900">
        <button 
             onClick={onBack}
             className="absolute top-4 right-8 hidden md:flex items-center justify-center p-2 bg-white dark:bg-gray-800 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm z-50 transition-colors"
             title="Fermer Clipboard"
        >
             <X size={24} />
        </button>

        {!result ? (
            <div className="flex flex-col items-center justify-center text-gray-400">
                <FileText size={64} className="mb-4 opacity-50" />
                <p>Configurez et générez votre document.</p>
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mt-4 text-purple-600 underline">Ouvrir la configuration</button>
            </div>
        ) : (
            <div className="w-full max-w-4xl relative">
                 <div className="flex justify-between items-center mb-4 no-print sticky top-0 bg-gray-100 dark:bg-gray-900 py-2 z-10">
                     <h2 className="font-bold text-xl dark:text-white truncate max-w-[200px]">{result.title}</h2>
                     <div className="flex gap-2">
                        <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-md">
                            <Download size={18} /> <span className="hidden md:inline">PDF</span>
                        </button>
                        {user.plan === 'pro_plus' && (
                             <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm shadow-md">
                                <Share2 size={18} /> <span className="hidden md:inline">Pack Pro+</span>
                            </button>
                        )}
                     </div>
                 </div>

                 {/* Document Render Container */}
                 <div ref={reportRef} className="bg-white shadow-2xl text-black">
                     
                     {/* 1. Cover Page - PDF Section */}
                     {result.content.cover && (
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 flex flex-col justify-between bg-white relative">
                            <div className="flex justify-between items-start mb-12">
                                <div className="text-left">
                                    <div className="font-bold uppercase tracking-widest text-sm">{result.content.cover.countrySymbol || "RÉPUBLIQUE"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold uppercase tracking-widest text-sm">{result.content.cover.schoolName || "ÉTABLISSEMENT"}</div>
                                </div>
                            </div>
                            
                            <div className="my-12 text-center">
                                <h1 className="text-5xl font-serif font-bold mb-4">{result.content.cover.title}</h1>
                                {result.content.cover.subtitle && <p className="text-xl italic">{result.content.cover.subtitle}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-left mt-auto">
                                <div>
                                    <p className="font-bold uppercase text-xs text-gray-500">Présenté par</p>
                                    <p className="text-lg">{result.content.cover.studentName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold uppercase text-xs text-gray-500">Professeur</p>
                                    <p className="text-lg">{result.content.cover.professorName}</p>
                                </div>
                            </div>
                            <div className="mt-8 text-center text-sm text-gray-500">
                                {result.content.cover.date}
                            </div>
                         </div>
                     )}

                     {/* 2. Introduction - PDF Section */}
                     <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white">
                         <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">Introduction</h2>
                         <p className="whitespace-pre-wrap text-justify leading-relaxed text-lg">{result.content.introduction}</p>
                     </div>

                     {/* 3. Sections - PDF Sections (One or more per section if needed, simplified here to one block per section for clarity, though long sections might still need logic. For now, we block them to ensure headers stick with content) */}
                     {result.content.sections.map((sec, i) => (
                         <div key={i} className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white">
                             <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-l-4 border-purple-600 pl-4">
                                 {sec.heading}
                             </h3>
                             <p className="whitespace-pre-wrap text-justify leading-relaxed mb-6">{sec.content}</p>
                             {sec.visualSuggestion && (
                                 <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-500 italic my-6 flex flex-col items-center justify-center">
                                     <span className="font-bold mb-1">Espace pour Illustration</span>
                                     Suggestion: {sec.visualSuggestion}
                                 </div>
                             )}
                         </div>
                     ))}

                     {/* 4. Conclusion - PDF Section */}
                     <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white">
                         <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">Conclusion</h2>
                         <p className="whitespace-pre-wrap text-justify leading-relaxed text-lg">{result.content.conclusion}</p>
                     </div>
                     
                     {/* 5. Bibliography - PDF Section */}
                     {result.content.bibliography && (
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white">
                             <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">Bibliographie</h2>
                             <ul className="list-disc pl-5 space-y-3">
                                 {result.content.bibliography.map((b, i) => <li key={i} className="leading-relaxed">{b}</li>)}
                             </ul>
                         </div>
                     )}
                 </div>
            </div>
        )}
      </main>
    </div>
  );
};
