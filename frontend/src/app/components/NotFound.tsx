import { Button } from './ui/button';
import { Home, Search, ArrowLeft, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-8">
            <h1 className="text-9xl font-black text-primary/10 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background p-4 rounded-full shadow-lg border border-primary/20">
                <Search className="w-16 h-16 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-primary mb-4">¡Ups! Página no encontrada</h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Parece que te has perdido en el campus digital. La página que buscas no existe o ha sido movida.
          </p>

          <div className="flex flex-col gap-3">
            <Link to="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90 w-full">
                <Home className="w-5 h-5 mr-2" />
                Volver al Inicio
              </Button>
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground">
                <HelpCircle className="w-4 h-4 mr-2" />
                Ayuda
              </Button>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">¿Buscabas algo en particular?</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/search" className="text-xs bg-muted px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">Libros</Link>
              <Link to="/search" className="text-xs bg-muted px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">Calculadoras</Link>
              <Link to="/search" className="text-xs bg-muted px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">Tecnología</Link>
              <Link to="/search" className="text-xs bg-muted px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors">Deportes</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
