import React, { useState, useRef, useEffect } from 'react';
import { User, DocType, GenerationConfig, GeneratedContent } from '../types';
import { X, ChevronRight, Download, FileText, Share2, Menu, Paperclip, BookOpen, Printer } from 'lucide-react';
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
      setIsSidebarOpen(false); 
    }
  }, [initialDoc]);

  // Mobile responsiveness initialization
  useEffect(() => {
    const handleLayout = () => {
        const width = window.innerWidth;
        if (width !== previousWidth.current) {
            if (width < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
            previousWidth.current = width;
        }

        if (width < 768) {
             const availableWidth = width - 32; 
             const a4Width = 794; 
             const newScale = Math.min(availableWidth / a4Width, 1);
             setScale(newScale);
        } else {
             setScale(1);
        }
    };
    
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
            if (doc.content.cover) {
                if (schoolLogo) doc.content.cover.schoolLogo = schoolLogo;
                if (countryEmblem) doc.content.cover.countrySymbol = countryEmblem;
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

  // Function to generate Dynamic Table of Contents based on structure
  const getDynamicTOC = (content: GeneratedContent['content']) => {
    const toc = [];
    let page = 1; // Start content at page 1

    toc.push({ title: "Introduction", page: page });
    page++;

    content.sections.forEach(s => {
        toc.push({ title: s.heading, page: page });
        page++;
    });

    toc.push({ title: "Conclusion", page: page });
    page++;

    if(content.bibliography?.length) {
        toc.push({ title: "Bibliographie", page: page });
    }
    return toc;
  };

  const downloadPDF = async () => {
      if (!reportRef.current || !result) return;
      
      const originalTitle = document.title;
      document.title = `WordPoz-${result.title}`;

      try {
          const clone = reportRef.current.cloneNode(true) as HTMLElement;
          const container = document.createElement('div');
          // Hide container but keep it rendered for canvas capture
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
              // Force white background and text colors for PDF render
              element.style.backgroundColor = 'white';
              element.style.color = 'black';

              const canvas = await html2canvas(element, { 
                  scale: 3, // High quality scale
                  useCORS: true,
                  windowWidth: 794 // Approx A4 width in px at 96dpi
              });
              
              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              const imgHeight = (canvas.height * pageWidth) / canvas.width;
              
              pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
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

  // Reusable Header/Footer for Content Pages
  const PageHeader = ({ title, sub }: { title: string, sub?: string }) => (
      <div className="absolute top-0 left-0 w-full h-24 px-12 pt-8 flex justify-between items-end border-b border-gray-200">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-sans font-bold">{sub || "Document Scolaire"}</div>
          <div className="text-sm font-bold text-gray-700 font-serif italic truncate max-w-[300px]">{title}</div>
      </div>
  );

  const PageFooter = ({ pageNum }: { pageNum?: number | string }) => (
      <div className="absolute bottom-0 left-0 w-full h-16 px-12 pb-6 flex justify-between items-center border-t border-gray-100">
          <div className="text-[10px] text-gray-300 font-sans tracking-wide">Généré par WordPoz AI</div>
          {pageNum && <div className="text-sm font-serif text-gray-600 font-bold">- {pageNum} -</div>}
      </div>
  );

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

            {result && (
                <button 
                    onClick={downloadPDF}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 flex justify-center items-center gap-2 mt-2"
                >
                    <Download size={20} /> Télécharger PDF
                </button>
            )}
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
                         
                         {/* 1. Cover Page */}
                         {result.content.cover && (
                             <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative flex flex-col justify-between">
                                 {/* Border - Fade In */}
                                 <div className="absolute inset-6 border-[3px] border-double border-gray-900 pointer-events-none animate-fade-in" style={{ animationDelay: '0s' }}></div>
                                 
                                 <div className="flex justify-between items-start mt-8 mx-8 h-32 relative z-10">
                                    <div className="text-left w-1/3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                        {result.content.cover.countrySymbol?.startsWith('data:image') ? (
                                            <img src={result.content.cover.countrySymbol} alt="Country" className="max-h-24 object-contain mb-2" />
                                        ) : (
                                            <div className="font-bold uppercase tracking-widest text-sm text-gray-600">{result.content.cover.countrySymbol || "RÉPUBLIQUE"}</div>
                                        )}
                                    </div>
                                    <div className="text-right w-1/3 flex flex-col items-end animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                        {result.content.cover.schoolLogo ? (
                                             <img src={result.content.cover.schoolLogo} alt="School" className="max-h-24 object-contain mb-2" />
                                        ) : null}
                                        <div className="font-bold uppercase tracking-widest text-sm text-gray-600">{result.content.cover.schoolName || "ÉTABLISSEMENT"}</div>
                                    </div>
                                </div>
                                
                                <div className="flex-1 flex flex-col justify-center items-center text-center px-16 relative z-10">
                                    {result.content.cover.educationLevel && (
                                        <div className="mb-8 font-serif italic text-xl text-gray-700 border-b border-gray-400 pb-2 px-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                                            {result.content.cover.educationLevel}
                                        </div>
                                    )}
                                    <h1 className="text-5xl font-serif font-black mb-6 leading-tight uppercase tracking-tight text-gray-900 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                                        {result.content.cover.title}
                                    </h1>
                                    {result.content.cover.subtitle && (
                                        <p className="text-2xl font-serif italic text-gray-600 mb-8 max-w-lg animate-fade-in" style={{ animationDelay: '0.8s' }}>
                                            {result.content.cover.subtitle}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-8 text-left mb-16 mx-16 relative z-10 animate-fade-in" style={{ animationDelay: '1s' }}>
                                    <div className="pl-4 border-l-4 border-gray-900">
                                        <p className="font-sans font-bold uppercase text-[10px] text-gray-500 tracking-wider mb-1">Présenté par</p>
                                        <p className="text-xl font-serif font-bold text-gray-900">{result.content.cover.studentName}</p>
                                    </div>
                                    <div className="text-right pr-4 border-r-4 border-gray-900">
                                        <p className="font-sans font-bold uppercase text-[10px] text-gray-500 tracking-wider mb-1">Sous la direction de</p>
                                        <p className="text-xl font-serif font-bold text-gray-900">{result.content.cover.professorName}</p>
                                    </div>
                                </div>
                                
                                <div className="text-center pb-8 font-serif italic text-gray-500 animate-fade-in" style={{ animationDelay: '1.2s' }}>
                                    {result.content.cover.date || new Date().toLocaleDateString()}
                                </div>
                             </div>
                         )}

                         {/* 2. Dynamic Table of Contents */}
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                             <PageHeader title={result.title} sub="Sommaire" />
                             <div className="mt-20 px-8">
                                <h2 className="text-3xl font-serif font-bold mb-12 text-center uppercase tracking-widest border-b-2 border-gray-900 pb-4">Sommaire</h2>
                                <div className="space-y-4">
                                    {getDynamicTOC(result.content).map((item, i) => (
                                        <div key={i} className="flex items-baseline w-full">
                                            <span className="font-serif text-lg font-bold text-gray-800 bg-white pr-2 z-10">{item.title}</span>
                                            <div className="flex-1 border-b-2 border-dotted border-gray-400 mx-2 mb-1"></div>
                                            <span className="font-serif text-lg font-bold text-gray-900 bg-white pl-2 z-10">{item.page}</span>
                                        </div>
                                    ))}
                                </div>
                             </div>
                             <PageFooter />
                         </div>

                         {/* 3. Introduction */}
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                             <PageHeader title={result.title} sub="Introduction" />
                             <div className="mt-20 px-8">
                                <h2 className="text-2xl font-sans font-bold mb-6 text-gray-900 uppercase tracking-wide">Introduction</h2>
                                <p className="whitespace-pre-wrap text-justify leading-loose text-lg font-serif text-gray-800">
                                    {result.content.introduction}
                                </p>
                             </div>
                             <PageFooter pageNum={1} />
                         </div>

                         {/* 4. Sections */}
                         {result.content.sections.map((sec, i) => (
                             <div key={i} className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                                 <PageHeader title={result.title} sub={`Partie ${i + 1}`} />
                                 <div className="mt-20 px-8">
                                     <div className="flex items-baseline gap-4 mb-8 border-b border-gray-200 pb-4">
                                         <span className="text-5xl font-sans font-black text-gray-200">{i + 1}</span>
                                         <h3 className="text-2xl font-serif font-bold text-gray-900 uppercase">{sec.heading}</h3>
                                     </div>
                                     
                                     <p className="whitespace-pre-wrap text-justify leading-loose text-lg font-serif text-gray-800 mb-8">
                                         {sec.content}
                                     </p>
                                     
                                     {sec.visualSuggestion && (
                                         <div className="mx-auto w-3/4 p-6 bg-gray-50 border border-gray-200 rounded text-center my-8 break-inside-avoid">
                                             <div className="flex justify-center mb-2 text-gray-400"><BookOpen size={24} /></div>
                                             <p className="text-xs font-bold uppercase text-gray-400 mb-1">Suggestion d'illustration</p>
                                             <p className="text-sm italic text-gray-600">"{sec.visualSuggestion}"</p>
                                         </div>
                                     )}
                                 </div>
                                 <PageFooter pageNum={i + 2} />
                             </div>
                         ))}

                         {/* 5. Conclusion */}
                         <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                             <PageHeader title={result.title} sub="Conclusion" />
                             <div className="mt-20 px-8">
                                 <h2 className="text-2xl font-sans font-bold mb-6 text-gray-900 uppercase tracking-wide">Conclusion</h2>
                                 <p className="whitespace-pre-wrap text-justify leading-loose text-lg font-serif text-gray-800">
                                     {result.content.conclusion}
                                 </p>
                             </div>
                             <PageFooter pageNum={result.content.sections.length + 2} />
                         </div>
                         
                         {/* 6. Bibliography */}
                         {result.content.bibliography && (
                             <div className="pdf-section w-[210mm] min-h-[297mm] p-12 bg-white relative">
                                 <PageHeader title={result.title} sub="Références" />
                                 <div className="mt-20 px-8">
                                     <h2 className="text-2xl font-sans font-bold mb-8 text-gray-900 uppercase tracking-wide border-b-2 border-black inline-block pb-1">Bibliographie</h2>
                                     <ul className="list-none space-y-4 pl-0">
                                         {result.content.bibliography.map((b, i) => (
                                             <li key={i} className="text-lg font-serif text-gray-700 pl-4 border-l-4 border-gray-200 py-1">
                                                 {b}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                                 <PageFooter />
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