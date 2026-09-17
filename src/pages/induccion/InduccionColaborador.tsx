import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { get, post } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, Clock, AlertTriangle, XCircle, FileCheck, Award, BookOpen, MapPin, Calendar, User, Building2 } from 'lucide-react';

interface Activity {
  id: string; dia: number; area_competencia: string; contenido: string;
  fecha: string; lugar: string; horario: string; facilitador: string;
  status: string; observaciones: string | null;
}

interface Program {
  id: string; user_id: string; empresa: string; area: string;
  fecha_ingreso: string; progreso: number; total_actividades: number;
  completadas: number; completed_at: string | null;
  survey_rating: string | null; survey_feedback: string | null;
  survey_commitment: boolean; certificate_generated_at: string | null;
  activities: Activity[];
}

const statusColors: Record<string, string> = {
  finalizado: 'bg-green-100 text-green-700 border-green-200',
  en_curso: 'bg-blue-100 text-blue-700 border-blue-200',
  aplazado: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelado: 'bg-red-100 text-red-700 border-red-200',
  pendiente: 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  finalizado: <CheckCircle2 className="h-4 w-4" />,
  en_curso: <Clock className="h-4 w-4" />,
  aplazado: <AlertTriangle className="h-4 w-4" />,
  cancelado: <XCircle className="h-4 w-4" />,
  pendiente: <Clock className="h-4 w-4" />,
};

function CertificadoPreview({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div className="border rounded-lg p-8 bg-white space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <Award className="h-16 w-16 text-primary mx-auto mb-2" />
        <h2 className="text-2xl font-bold">Certificado de Inducción</h2>
        <p className="text-muted-foreground">Programa de Inducción Completado</p>
      </div>
      <Separator />
      <div className="space-y-3">
        <p className="text-center text-lg font-semibold">{data.colaborador}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Cargo:</span><span className="font-medium">{data.cargo}</span>
          <span className="text-muted-foreground">Empresa:</span><span className="font-medium">{data.empresa}</span>
          <span className="text-muted-foreground">Fecha ingreso:</span><span className="font-medium">{data.fecha_ingreso}</span>
          <span className="text-muted-foreground">Completado:</span><span className="font-medium">{data.fecha_completado}</span>
        </div>
      </div>
      <Separator />
      <p className="text-xs text-center text-muted-foreground">Certificado emitido por Talento Humano</p>
      <p className="text-sm text-center mt-2">{data.firma_th}</p>
      <div className="flex justify-center gap-2">
        <Button onClick={() => window.print()}>Imprimir</Button>
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
}

export default function InduccionColaborador() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCert, setShowCert] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  const [surveyRating, setSurveyRating] = useState('');
  const [surveyFeedback, setSurveyFeedback] = useState('');
  const [surveyCommitment, setSurveyCommitment] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['mi-induccion'],
    queryFn: async () => {
      const res = await get<{ data: Program | null }>('/api/induccion/mi-programa');
      return res.data?.data;
    },
  });

  const program = data;

  const encuestaMutation = useMutation({
    mutationFn: async () => {
      await post('/api/induccion/encuesta', {
        survey_rating: surveyRating,
        survey_feedback: surveyFeedback,
        survey_commitment: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-induccion'] });
      toast({ title: 'Encuesta guardada', description: 'Gracias por tu retroalimentación.' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }),
  });

  const certificadoMutation = useMutation({
    mutationFn: async () => {
      const res = await post<{ data: any }>('/api/induccion/certificado');
      return res.data;
    },
    onSuccess: (res: any) => {
      setCertData(res.data);
      setShowCert(true);
      queryClient.invalidateQueries({ queryKey: ['mi-induccion'] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err?.response?.data?.message || err.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Mi Programa de Inducción</h1><p className="text-muted-foreground">No tienes un programa de inducción asignado.</p></div>
        <Card><CardContent className="py-8 text-center text-muted-foreground">Comunícate con Talento Humano para que te asignen tu programa.</CardContent></Card>
      </div>
    );
  }

  const groupedByDay = program.activities.reduce<Record<number, Activity[]>>((acc, a) => {
    (acc[a.dia] = acc[a.dia] || []).push(a);
    return acc;
  }, {});

  const days = Object.keys(groupedByDay).map(Number).sort();
  const isComplete = program.progreso === 100;
  const hasSurvey = !!program.survey_rating;
  const hasCert = !!program.certificate_generated_at;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Programa de Inducción</h1>
        <p className="text-muted-foreground">{program.empresa} — {program.area}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Progreso General</span>
            <span className="text-sm font-mono">{program.progreso}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={program.progreso} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{program.completadas} de {program.total_actividades} actividades completadas</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {['pendiente', 'en_curso', 'finalizado', 'aplazado', 'cancelado'].map(s => (
          <Badge key={s} className={statusColors[s]}>{statusIcons[s]} {s.replace('_', ' ')}</Badge>
        ))}
      </div>

      {days.map(day => (
        <Card key={day}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Día {day}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupedByDay[day].map(act => (
              <div key={act.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3">
                <Badge className={`shrink-0 ${statusColors[act.status] || ''}`}>
                  {statusIcons[act.status]} {act.status.replace('_', ' ')}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{act.contenido}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {act.area_competencia}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(act.fecha).toLocaleDateString('es-AR')}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {act.horario}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {act.lugar}</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {act.facilitador}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {isComplete && !hasSurvey && (
        <Card>
          <CardHeader><CardTitle className="text-base">Encuesta de Satisfacción</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>¿Cómo calificarías tu proceso de inducción?</Label>
              <RadioGroup value={surveyRating} onValueChange={setSurveyRating} className="flex gap-4 mt-2">
                {['excelente', 'bueno', 'malo'].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <RadioGroupItem value={r} id={`rating-${r}`} />
                    <Label htmlFor={`rating-${r}`} className="capitalize">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>¿Qué podríamos mejorar?</Label>
              <Textarea value={surveyFeedback} onChange={e => setSurveyFeedback(e.target.value)} rows={3} placeholder="Tus sugerencias..." />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="commitment" checked={surveyCommitment} onCheckedChange={v => setSurveyCommitment(!!v)} />
              <Label htmlFor="commitment">Confirmo que entregaré la documentación requerida a Talento Humano</Label>
            </div>
            <Button onClick={() => encuestaMutation.mutate()} disabled={!surveyRating || !surveyCommitment || encuestaMutation.isPending}>
              {encuestaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Guardar Encuesta
            </Button>
          </CardContent>
        </Card>
      )}

      {isComplete && hasSurvey && !hasCert && (
        <Card>
          <CardContent className="py-6 text-center space-y-4">
            <Award className="h-12 w-12 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">¡Inducción completada!</h3>
            <p className="text-sm text-muted-foreground">Genera tu certificado de inducción</p>
            <Button onClick={() => certificadoMutation.mutate()} disabled={certificadoMutation.isPending}>
              {certificadoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileCheck className="h-4 w-4 mr-1" />}
              Generar Certificado
            </Button>
          </CardContent>
        </Card>
      )}

      {hasCert && (
        <Card>
          <CardContent className="py-6 text-center space-y-4">
            <Award className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Certificado generado</h3>
            <p className="text-sm text-muted-foreground">Ya completaste todo el proceso de inducción.</p>
            <Button variant="outline" onClick={() => certificadoMutation.mutate()}>
              <FileCheck className="h-4 w-4 mr-1" /> Ver Certificado
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCert} onOpenChange={o => { if (!o) setShowCert(false); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Certificado</DialogTitle><DialogDescription>Programa de Inducción Completado</DialogDescription></DialogHeader>
          {certData && <CertificadoPreview data={certData} onClose={() => setShowCert(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
