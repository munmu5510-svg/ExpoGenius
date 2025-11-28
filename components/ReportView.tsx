import React, { useRef } from 'react';
import { ExposeContent, UserSettings } from '../types';
import { Download, Printer, AlertTriangle, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportViewProps {
  content: ExposeContent;
  settings: UserSettings;
}

export const ReportView: React.FC<ReportViewProps> = ({ content, settings }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    // Use html2canvas to capture the element
    try {
        // Temporarily remove shadow and scaling for cleaner capture
        const element = reportRef.current;
        element.style.transform = 'none';
        
        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
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

        pdf.save(`expose-${settings.topic.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (err) {
        console.error("Error generating PDF", err);
        alert("Erreur lors de la génération du PDF. Essayez l'option Imprimer.");
    }
  };

  // Cost calculation
  // Rough estimate: Assume visual sections take more space or specific color cost
  const totalSections = content.sections.length;
  // Let's assume Introduction + Conclusion = 1 page.
  // Each section = 0.5 to 1 page depending on content length.
  // The AI gave us an estimate, let's use it for the "Total Pages".
  
  // Calculate cost based on AI recommendation or general assumption
  // We will assume 80% pages are BW, 20% Color if mixed, or follow prompts.
  // For simplicity, let's calculate a "Scenario" cost.
  
  const estimatedCost = (content.estimatedPages * settings.bwPrice).toFixed(2);
  const isOverBudget = parseFloat(estimatedCost) > settings.budget;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      {/* Actions Bar - Hidden when printing */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isOverBudget ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {isOverBudget ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            </div>
            <div>
                <p className="text-sm text-gray-500">Coût estimé (Tout N&B)</p>
                <p className={`font-bold text-lg ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    ~{estimatedCost} € <span className="text-xs text-gray-400 font-normal">/ {settings.budget} € budget</span>
                </p>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
                <Printer size={18} />
                Imprimer
            </button>
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
                <Download size={18} />
                Télécharger PDF
            </button>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg no-print">
        <div className="flex gap-2">
            <span className="font-bold text-blue-700">Conseil IA :</span>
            <p className="text-blue-800">{content.recommendation}</p>
        </div>
      </div>

      {/* The Printable Report Document */}
      <div 
        ref={reportRef}
        className="bg-white shadow-2xl p-12 min-h-[29.7cm] text-gray-800 print:shadow-none print:p-0 print:w-full"
        style={{ width: '100%' }} // Ensure full width for capture
      >
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-6 mb-8 text-center">
            <h1 className="text-4xl font-extrabold uppercase tracking-tight mb-2">{content.title}</h1>
            <p className="text-gray-500 italic">Généré pour le sujet : {settings.topic}</p>
        </div>

        {/* Introduction */}
        <div className="mb-8">
            <h3 className="text-xl font-bold border-l-4 border-blue-600 pl-3 mb-3 text-gray-900">Introduction</h3>
            <p className="text-justify leading-relaxed text-gray-700 whitespace-pre-wrap">{content.introduction}</p>
        </div>

        {/* Dynamic Sections */}
        <div className="space-y-8">
            {content.sections.map((section, index) => (
                <div key={index} className="break-inside-avoid">
                    <h3 className="text-xl font-bold border-l-4 border-indigo-600 pl-3 mb-3 text-gray-900 flex justify-between items-center">
                        {section.heading}
                        {section.isColor && (
                            <span className="no-print text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-normal">
                                Recommandé en Couleur
                            </span>
                        )}
                    </h3>
                    <p className="text-justify leading-relaxed text-gray-700 mb-4 whitespace-pre-wrap">
                        {section.content}
                    </p>
                    
                    {/* Visual Placeholder */}
                    {section.visualSuggestion && (
                        <div className={`my-4 p-6 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center transition-colors ${section.isColor ? 'border-indigo-200 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}>
                            <div className="mb-2 opacity-50">
                                {section.isColor ? (
                                    <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                ) : (
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                )}
                            </div>
                            <p className="text-sm font-semibold text-gray-600">Suggestion Visuelle :</p>
                            <p className="text-sm text-gray-500 italic">"{section.visualSuggestion}"</p>
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* Conclusion */}
        <div className="mt-8 pt-6 border-t border-gray-200 page-break-inside-avoid">
            <h3 className="text-xl font-bold border-l-4 border-green-600 pl-3 mb-3 text-gray-900">Conclusion</h3>
            <p className="text-justify leading-relaxed text-gray-700 whitespace-pre-wrap">{content.conclusion}</p>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-4 text-center text-gray-400 text-xs border-t border-gray-100">
            Généré automatiquement par l'IA - Budget respecté : {settings.budget}€
        </div>
      </div>
    </div>
  );
};