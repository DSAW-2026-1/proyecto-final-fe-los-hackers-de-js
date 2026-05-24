import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface ConnectionErrorProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function ConnectionError({ 
  onRetry, 
  title = "Error de conexión", 
  message = "No pudimos establecer contacto con el servidor para obtener la información solicitada. Por favor, verifica tu conexión e inténtalo de nuevo." 
}: ConnectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="bg-destructive/10 p-4 rounded-full">
        <AlertTriangle className="w-12 h-12 text-destructive" />
      </div>
      <div className="max-w-md">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} size="lg">
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}
