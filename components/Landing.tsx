import React from 'react';
import { ArrowRight, CheckCircle, Users, FileText, BarChart, Sparkles, DollarSign, Quote } from 'lucide-react';

export const Landing = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <nav className="p-4 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full wos-gradient flex items-center justify-center text-white font-serif font-bold">W</div>
              <span className="font-serif font-bold text-xl">WyRunner</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
              <a href="#features" className="hover:text-purple-600 transition">Características</a>
              <a href="#pricing" className="hover:text-purple-600 transition">Precios</a>
              <a href="#" className="hover:text-purple-600 transition">Plantillas</a>
          </div>
          <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm font-bold">🇪🇸</span>
              <button onClick={onGetStarted} className="px-5 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  Iniciar Sesión
              </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-purple-700 bg-purple-100 rounded-full mb-4">
          Powered by AI
        </div>
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
            Excelencia Académica<br/><span className="wos-text-gradient">Automatizada</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Crea presentaciones, ensayos y tesis de calidad profesional en pocos clics. Optimizado para tu presupuesto.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onClick={onGetStarted}
                className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white transition-all duration-200 wos-gradient rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 hover:shadow-lg hover:scale-105"
            >
                Comenzar Gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#pricing" className="inline-flex items-center justify-center px-8 py-3 text-base font-bold rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                Ver Precios
            </a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-left">
            <div className="text-center">
                <p className="text-3xl font-bold wos-text-gradient">1K+</p>
                <p className="text-sm text-gray-500">Usuarios</p>
            </div>
            <div className="text-center">
                <p className="text-3xl font-bold wos-text-gradient">10K+</p>
                <p className="text-sm text-gray-500">Documentos</p>
            </div>
            <div className="text-center">
                <p className="text-3xl font-bold wos-text-gradient">98%</p>
                <p className="text-sm text-gray-500">Satisfacción</p>
            </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold font-serif mb-2">¿Por qué WyRunner?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-12">Herramientas poderosas para tu trabajo académico</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
                <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4"><FileText size={24} /></div>
                    <h3 className="text-lg font-bold mb-2">Presentaciones Completas</h3>
                    <p className="text-sm text-gray-500">Portada, índice, introducción, contenido estructurado, conclusión, glosario y bibliografía generados automáticamente.</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><Quote size={24} /></div>
                    <h3 className="text-lg font-bold mb-2">Ensayos y Argumentos</h3>
                    <p className="text-sm text-gray-500">Tesis, antítesis, síntesis perfectamente articuladas según tus instrucciones y longitud deseada.</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                     <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mb-4"><DollarSign size={24} /></div>
                    <h3 className="text-lg font-bold mb-2">Gestión de Presupuesto</h3>
                    <p className="text-sm text-gray-500">Optimiza tus costos de impresión con nuestra calculadora integrada. Color o blanco y negro, tú decides.</p>
                </div>
                 <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center mb-4"><Sparkles size={24} /></div>
                    <h3 className="text-lg font-bold mb-2">IA Avanzada</h3>
                    <p className="text-sm text-gray-500">Runna, tu asistente de IA personal, te guía en cada paso de la creación de tus documentos.</p>
                </div>
            </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold font-serif mb-2">Precios Simples y Transparentes</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-12">Elige el plan que te convenga</p>
            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Freemium Plan */}
                <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-left">
                    <h3 className="text-lg font-bold text-purple-600 mb-2">Freemium</h3>
                    <p className="text-4xl font-bold mb-4">Gratis</p>
                    <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> 6 generaciones gratis</li>
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Acceso al estudio</li>
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Plantillas comunitarias</li>
                    </ul>
                    <button onClick={onGetStarted} className="w-full py-3 rounded-lg border border-purple-600 text-purple-600 font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition">Comenzar</button>
                </div>

                {/* Starter Plan (Popular) */}
                <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-purple-600 text-left relative">
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full uppercase">Popular</div>
                    <h3 className="text-lg font-bold text-purple-600 mb-2">Starter</h3>
                    <p className="text-4xl font-bold mb-4">200 FCFA <span className="text-base font-normal text-gray-500">/día</span></p>
                    <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Generaciones ilimitadas</li>
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Exportar PDF</li>
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Soporte prioritario</li>
                    </ul>
                    <button className="w-full py-3 rounded-lg wos-gradient text-white font-bold hover:opacity-90 transition">Elegir Starter</button>
                </div>
                
                {/* Pro Authority Plan */}
                <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-left">
                    <h3 className="text-lg font-bold text-purple-600 mb-2">Pro Authority</h3>
                    <p className="text-4xl font-bold mb-4">500 FCFA <span className="text-base font-normal text-gray-500">/7 días</span></p>
                    <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Generaciones ilimitadas</li>
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Exportar PDF y PPT</li>
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Versión PowerPoint</li>
                        <li className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500" /> Soporte VIP</li>
                    </ul>
                    <button className="w-full py-3 rounded-lg border border-purple-600 text-purple-600 font-bold hover:bg-purple-50 dark:hover:bg-purple-900/20 transition">Elegir Pro</button>
                </div>
            </div>
            <p className="mt-12 text-sm text-gray-500">Pago móvil : +240 555 320 354</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-200 dark:border-gray-800">
         <div className="flex items-center justify-center gap-2 mb-4">
             <div className="w-8 h-8 rounded-full wos-gradient flex items-center justify-center text-white font-serif font-bold">W</div>
             <span className="font-serif font-bold text-xl">WyRunner</span>
         </div>
         <p className="text-gray-500 text-sm mb-2">© 2026 WyRunner. Todos los derechos reservados</p>
         <p className="text-xs text-gray-400">Made within Africa</p>
      </footer>
    </div>
  );
};