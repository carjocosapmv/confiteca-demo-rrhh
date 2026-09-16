import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, FileText } from 'lucide-react';

const NuevaSolicitud = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nueva Solicitud</h1>
        <p className="text-muted-foreground">Selecciona el tipo de solicitud que deseas realizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
          onClick={() => navigate('/vacaciones/nuevo-permiso')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Solicitar Permiso</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Solicita una licencia por paternidad, maternidad, lactancia, permiso médico,
              cursos empresariales o calamidad doméstica.
            </p>
            <Button className="mt-4 w-full" variant="outline">
              Ir a permisos
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
          onClick={() => navigate('/vacaciones/nueva-vacacion')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600 group-hover:bg-green-500/20 transition-colors">
                <CalendarDays className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Solicitar Vacaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Solicita tus vacaciones indicando los días y fechas deseadas.
              Se calculará automáticamente el saldo disponible.
            </p>
            <Button className="mt-4 w-full" variant="outline">
              Ir a vacaciones
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NuevaSolicitud;
