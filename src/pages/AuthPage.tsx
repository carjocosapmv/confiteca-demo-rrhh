import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { BrandMark } from '@/components/BrandMark';
import pmvLogo from '@/assets/pmv-logo.png';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Sesión iniciada');
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-card border-border/60">
          <CardHeader className="text-center space-y-4">
            <BrandMark className="items-center text-center" tagline="Plataforma de Talento Humano" />
            <div className="space-y-1">
              <CardTitle className="text-xl">Sistema de gestión interno</CardTitle>
              <CardDescription>Inicia sesión para continuar</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@empresa.com" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="mt-1" />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Los usuarios son creados por el administrador del sistema.
            </p>
          </CardContent>
        </Card>
      </div>
      <footer className="h-12 flex items-center justify-end border-t border-border px-4 bg-card/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Powered by</span>
          <img src={pmvLogo} alt="PMV Agency" className="h-4 w-auto dark:invert" />
        </div>
      </footer>
    </div>
  );
}
