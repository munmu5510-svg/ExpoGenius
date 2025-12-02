import React, { useState, useRef } from 'react';
import { User, DocType, GenerationConfig, GeneratedContent } from '../types';
import { X, ChevronRight, Download, FileText, Printer, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ClipboardProps {
  user: User;
  onBack: () => void;
  onGenerate: (config: GenerationConfig) => Promise<GeneratedContent | null>;
}

export const Clipboard = ({ user, onBack, onGenerate }: ClipboardProps) => {
  const [docType, setDocType] = useState<DocType>('expose');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);

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
        if (doc) setResult(doc);
    } catch (e) {
        alert("Erreur de génération");
    } finally {
        setLoading(false);
    }
  };

  const downloadPDF = async () => {
      if (!reportRef.current) return;
      // Basic PDF logic from previous version
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const imgWidth = 210; 
      const pageHeight = 297; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`WordShelter-${docType}.pdf`);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar Configuration */}
      <aside className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-y-auto shrink-0 z-20 absolute md:relative">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-lg dark:text-white">Configuration</h2>
            <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={20} />
            </button>
        </div>

        <div className="p-4 space-y-6">
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
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-gray-100 dark:bg-gray-900">
        {!result ? (
            <div className="flex flex-col items-center justify-center text-gray-400">
                <FileText size={64} className="mb-4 opacity-50" />
                <p>Configurez et générez votre document.</p>
            </div>
        ) : (
            <div className="w-full max-w-4xl">
                 <div className="flex justify-between items-center mb-4 no-print">
                     <h2 className="font-bold text-xl dark:text-white">{result.title}</h2>
                     <div className="flex gap-2">
                        <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            <Download size={18} /> <span className="hidden md:inline">PDF</span>
                        </button>
                        {user.plan === 'pro_plus' && (
                             <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600">
                                <Share2 size={18} /> <span className="hidden md:inline">Pack Pro+</span>
                            </button>
                        )}
                     </div>
                 </div>

                 {/* Document Render */}
                 <div ref={reportRef} className="bg-white shadow-2xl min-h-[29.7cm] p-8 md:p-12 text-black">
                     {/* Cover Page */}
                     {result.content.cover && (
                         <div className="cover-page mb-24 text-center border-b-2 border-black pb-12 break-after-page">
                            <div className="flex justify-between items-start mb-12">
                                <div className="text-left">
                                    <div className="font-bold uppercase tracking-widest text-sm">{result.content.cover.countrySymbol || "RÉPUBLIQUE"}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold uppercase tracking-widest text-sm">{result.content.cover.schoolName || "ÉTABLISSEMENT"}</div>
                                </div>
                            </div>
                            
                            <div className="my-12">
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
                            <div className="mt-8 text-sm text-gray-500">
                                {result.content.cover.date}
                            </div>
                         </div>
                     )}

                     {/* Content */}
                     <div className="prose max-w-none">
                         <h2 className="text-2xl font-bold mb-4">Introduction</h2>
                         <p className="whitespace-pre-wrap mb-8 text-justify">{result.content.introduction}</p>

                         {result.content.sections.map((sec, i) => (
                             <div key={i} className="mb-8">
                                 <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                     {sec.heading}
                                     {sec.isColor && <span className="no-print text-[10px] bg-blue-100 text-blue-800 px-1 rounded">Couleur recommandée</span>}
                                 </h3>
                                 <p className="whitespace-pre-wrap text-justify mb-2">{sec.content}</p>
                                 {sec.visualSuggestion && (
                                     <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded text-center text-sm text-gray-500 italic">
                                         [Suggestion image: {sec.visualSuggestion}]
                                     </div>
                                 )}
                             </div>
                         ))}

                         <h2 className="text-2xl font-bold mb-4">Conclusion</h2>
                         <p className="whitespace-pre-wrap mb-8 text-justify">{result.content.conclusion}</p>
                         
                         {result.content.bibliography && (
                             <div className="border-t pt-4">
                                 <h4 className="font-bold">Bibliographie</h4>
                                 <ul className="list-disc pl-5">
                                     {result.content.bibliography.map((b, i) => <li key={i}>{b}</li>)}
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
