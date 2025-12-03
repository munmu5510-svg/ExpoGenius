import React, { useState, useRef, useEffect } from 'react';
import { User, DocType, GenerationConfig, GeneratedContent } from '../types';
import { X, ChevronRight, Download, FileText, Share2, Menu, Paperclip } from 'lucide-react';
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
  const [scale, setScale] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previousWidth = useRef<number>(window.innerWidth);

  // Form States
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  // Exposé specific
  const [currency, setCurrency] = useState('XAF');
  const [bwPrice, setBwPrice] = useState(25);
  const [colorPrice, setColorPrice] = useState(100);
  const [budget, setBudget] = useState(1000);
  const [school, setSchool] = useState('');
  const [country, setCountry] = useState('');
  const [professor, setProfessor] = useState('');
  const [date, setDate] = useState('');
  
  // Image Upload States
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [countryEmblem, setCountryEmblem] = useState<string | null>(null);
  const schoolInputRef = useRef<HTMLInputElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);

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
      // If the doc has stored images (mock scenario), we would load them here
    }
  }, [initialDoc]);

  // Mobile responsiveness initialization ONLY
  useEffect(() => {
    const handleLayout = () => {
        const width = window.innerWidth;
        // Only trigger sidebar change if width changes (orientation change or desktop resize)
        // NOT on height change (keyboard appearance)
        if (width !== previousWidth.current) {
            if (width < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
            previousWidth.current = width;
        }

        // Scale calculation always runs to fit screen
        if (width < 768) {
             // A4 width is approx 794px. We need to scale it down to fit mobile screen.
             const availableWidth = width - 32; // 16px padding on each side
             const a4Width = 794; 
             const newScale = Math.min(availableWidth / a4Width, 1);
             setScale(newScale);
        } else {
             setScale(1);
        }
    };
    
    // Initial call
    handleLayout();

    window.addEventListener('resize', handleLayout);
    return () => window.removeEventListener('resize', handleLayout);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  setter(ev.target.result as string);
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

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
            // Inject manually uploaded images into the result object context for rendering
            if (doc.content.cover) {
                if (schoolLogo) doc.content.cover.schoolLogo = schoolLogo;
                if (countryEmblem) doc.content.cover.countrySymbol = countryEmblem; // Use image instead of text if available
            }
            setResult(doc);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }
    } catch (e) {
        alert("Erreur de génération");
    } finally {
        setLoading(false);
    }
  };

  const downloadPDF = async () => {
      if (!reportRef.current || !result) return;
      
      const originalTitle = document.title;
      document.title = `WordPoz-${result.title}`;

      try {
          const clone = reportRef.current.cloneNode(true) as HTMLElement;
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.top = '-9999px';
          container.style.left = '0';
          container.style.zIndex = '-1';
          container.style.width = '210mm'; 
          container.appendChild(clone);
          document.body.appendChild(container);

          const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
          const pageWidth = 210;
          const sections = clone.querySelectorAll('.pdf-section');
          
          for (let i = 0; i < sections.length; i++) {
              if (i > 0) pdf.addPage();
              const element = sections[i] as HTMLElement;
              element.style.backgroundColor = 'white';

              const canvas = await html2canvas(element, { 
                  scale: 2, 
                  useCORS: true,
                  windowWidth: 1200
              });
              
              const imgData = canvas.toDataURL('image/png');
              const imgHeight = (canvas.height * pageWidth) / canvas.width;
              
              pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
          }

          pdf.save(`WordPoz-${result.title || 'Document'}.pdf`);
          document.body.removeChild(container);
          
      } catch (err) {
          console.error("PDF Error", err);
          alert("Erreur lors de la création du PDF.");
      } finally {
          document.title = originalTitle;
      }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-4 z-30">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
               <Menu />
           </button>
           <span className="font-bold truncate max-w-[150px]">{result ? result.title : 'Clipboard'}</span>
           <button onClick={onBack} className="p-2 bg-red-50 text-red-500 rounded-full"><X size={18} /></button>
      </div>

      {/* Sidebar Configuration */}
      <aside className={`
          absolute md:relative top-0 left-0 h-full w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          flex flex-col z-20 transition-transform duration-300 transform 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}
          pt-14 md:pt-0 shadow-2xl md:shadow-none
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

            {docType === 'expose' && (
                <>
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Thème" value={topic} onChange={e => setTopic(e.target.value)} />
                    <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Niveau d'étude" value={level} onChange={e => setLevel(e.target.value)} />
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-400">Devise & Budget</label>
                        <select 
                            value={currency} 
                            onChange={e => setCurrency(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="XAF">FCFA (XAF)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="USD">Dollar ($)</option>
                            <option value="CAD">Dollar (CAD)</option>
                            <option value="GNF">Franc (GNF)</option>
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                                <label className="text-[10px] text-gray-400">Budget Total</label>
                                <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" type="number" value={budget} onChange={e => setBudget(parseFloat(e.target.value))} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] text-gray-400">Prix page N&B</label>
                                <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" type="number" value={bwPrice} onChange={e => setBwPrice(parseFloat(e.target.value))} />
                            </div>
                            <div className="flex flex-col col-span-2">
                                <label className="text-[10px] text-gray-400">Prix page Couleur</label>
                                <input className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" type="number" value={colorPrice} onChange={e => setColorPrice(parseFloat(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* Inputs with Paperclip for Images */}
                    <div className="relative">
                        <input className="w-full p-2 pr-10 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Établissement" value={school} onChange={e => setSchool(e.target.value)} />
                        <button onClick={() => schoolInputRef.current?.click()} className="absolute right-2 top-2 text-gray-400 hover:text-purple-600 bg-transparent p-1">
                            {schoolLogo ? <span className="text-green-500 font-bold text-xs">IMG</span> : <Paperclip size={18} />}
                        </button>
                        <input type="file" ref={schoolInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setSchoolLogo)} />
                    </div>

                    <div className="relative">
                        <input className="w-full p-2 pr-10 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Pays" value={country} onChange={e => setCountry(e.target.value)} />
                        <button onClick={() => countryInputRef.current?.click()} className="absolute right-2 top-2 text-gray-400 hover:text-purple-600 bg-transparent p-1">
                             {countryEmblem ? <span className="text-green-500 font-bold text-xs">IMG</span> : <Paperclip size={18} />}
                        </button>
                         <input type="file" ref={countryInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCountryEmblem)} />
                    </div>

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
      <main ref={previewContainerRef} className="flex-1 overflow-y-auto pt-14 md:pt-4 p-4 md:p-8 flex justify-center bg-gray-100 dark:bg-gray-900">
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
            <div className="w-full flex justify-center items-start">
                 {/* This wrapper handles the A4 scaling on mobile */}
                 <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: '210mm' }} className="transition-transform duration-200">
                     
                     <div className="flex justify-between items-center mb-4 no-print bg-gray-100 dark:bg-gray-900 py-2">
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
                                <div className="flex justify-between items-start mb-12 h-32">
                                    <div className="text-left w-1/3 flex flex-col items-start justify-start h-full">
                                        {/* Country Symbol / Image */}
                                        {result.content.cover.countrySymbol?.startsWith('data:image') ? (
                                            <img src={result.content.cover.countrySymbol} alt="Country" className="max-h-24 object-contain mb-2" />
                                        ) : (
                                            <div className="font-bold uppercase tracking-widest text-sm">{result.content.cover.countrySymbol || "RÉPUBLIQUE"}</div>
                                        )}
                                    </div>
                                    <div className="text-right w-1/3 flex flex-col items-end justify-start h-full">
                                        {/* School Logo / Name */}
                                        {result.content.cover.schoolLogo ? (
                                             <img src={result.content.cover.schoolLogo} alt="School" className="max-h-24 object-contain mb-2" />
                                        ) : null}
                                        <div className="font-bold uppercase tracking-widest text-sm">{result.content.cover.schoolName || "ÉTABLISSEMENT"}</div>
                                    </div>
                                </div>
                                
                                <div className="my-12 text-center">
                                    <h1 className="text-5xl font-serif font-bold mb-4">{result.content.cover.title}</h1>
                                    {result.content.cover.subtitle && <p className="text-xl italic mb-4">{result.content.cover.subtitle}</p>}
                                    {result.content.cover.educationLevel && <p className="text-lg font-bold uppercase text-gray-600 border-t border-b border-gray-300 inline-block py-2 px-8">{result.content.cover.educationLevel}</p>}
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

                         {/* 2. TOC - PDF Section (NEW) */}
                         {result.content.toc && result.content.toc.length > 0 && (
                             <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white">
                                 <h2 className="text-3xl font-bold mb-8 text-center uppercase tracking-wider">Sommaire</h2>
                                 <div className="space-y-4">
                                     {result.content.toc
                                         .filter(item => !['couverture', 'sommaire', 'questions-réponses', 'questions réponses', 'discours', 'speech', 'q&a', 'présentation'].some(exclude => item.title.toLowerCase().includes(exclude)))
                                         .map((item, i) => (
                                         <div key={i} className="flex items-end">
                                             <span className="font-medium text-lg bg-white pr-2 z-10">{item.title}</span>
                                             <div className="flex-1 border-b-2 border-dotted border-gray-400 mb-1 mx-2"></div>
                                             <span className="font-bold text-lg bg-white pl-2 z-10">{item.page}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}

                         {/* 3. Introduction - PDF Section */}
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white">
                             <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">Introduction</h2>
                             <p className="whitespace-pre-wrap text-justify leading-relaxed text-lg">{result.content.introduction}</p>
                         </div>

                         {/* 4. Sections - PDF Sections */}
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

                         {/* 5. Conclusion - PDF Section */}
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white">
                             <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">Conclusion</h2>
                             <p className="whitespace-pre-wrap text-justify leading-relaxed text-lg">{result.content.conclusion}</p>
                         </div>
                         
                         {/* 6. Bibliography - PDF Section */}
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
            </div>
        )}
      </main>
    </div>
  );
};