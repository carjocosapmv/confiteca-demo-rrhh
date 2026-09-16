import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { get, post } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Loader2, Heart, Building2, FileText, Shield, Monitor, GraduationCap, TrendingUp, Gift } from 'lucide-react';

const CHAPTER_ICONS: Record<string, React.ElementType> = {
  Heart, Building2, FileText, Shield, Monitor, GraduationCap, TrendingUp, Gift,
};

interface Chapter {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string | null;
  orden: number;
  videos: Video[];
  chapter_progress: number;
  chapter_watched: number;
  chapter_total: number;
}

interface Video {
  id: string;
  titulo: string;
  departamento: string;
  duracion_minutos: number;
  url: string;
  descripcion: string;
  orden: number;
  watched: boolean;
}

interface OnboardingData {
  chapters: Chapter[];
  progress: number;
  total: number;
  watched: number;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function YouTubePlayer({ url, videoId, onEnded }: { url: string; videoId: string; onEnded: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ytId = extractYouTubeId(url);
    if (!ytId || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const div = document.createElement('div');
    div.id = `yt-player-${videoId}`;
    container.appendChild(div);

    const onYouTubeReady = () => {
      playerRef.current = new (window as any).YT.Player(div.id, {
        videoId: ytId,
        height: '100%',
        width: '100%',
        playerVars: { autoplay: 1, rel: 0, controls: 0 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              onEndedRef.current();
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      onYouTubeReady();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(tag, firstScript);
      (window as any).onYouTubeIframeAPIReady = onYouTubeReady;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [url, videoId]);

  return (
    <div className="aspect-video w-full relative bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  const { user } = useAuth();
  const { canView } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playingVideo, setPlayingVideo] = useState<{ id: string; url: string; titulo: string } | null>(null);

  const { data, isLoading } = useQuery<OnboardingData>({
    queryKey: ['onboarding-videos'],
    queryFn: async () => {
      const res = await get<OnboardingData>('/api/onboarding/videos');
      return res.data;
    },
  });

  const markMutation = useMutation({
    mutationFn: (videoId: string) => post('/api/onboarding/mark-watched', { video_id: videoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-videos'] });
    },
  });

  const unmarkMutation = useMutation({
    mutationFn: (videoId: string) => post('/api/onboarding/mark-unwatched', { video_id: videoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-videos'] });
    },
  });

  const toggleWatched = (videoId: string, watched: boolean) => {
    if (watched) {
      unmarkMutation.mutate(videoId);
    } else {
      markMutation.mutate(videoId);
    }
  };

  const handleVideoEnded = useCallback(() => {
    if (playingVideo) {
      markMutation.mutate(playingVideo.id);
      toast({ title: 'Video completado', description: 'Se marcó automáticamente como visto.' });
    }
  }, [playingVideo, markMutation, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inducción y Onboarding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Completá los capítulos de inducción para familiarizarte con la empresa.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tu progreso general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={data?.progress ?? 0} className="flex-1 h-3" />
            <span className="text-sm font-medium tabular-nums whitespace-nowrap">
              {data?.watched ?? 0} / {data?.total ?? 0} ({data?.progress ?? 0}%)
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {data?.chapters.map((chapter) => {
          const IconComponent = chapter.icono && CHAPTER_ICONS[chapter.icono] ? CHAPTER_ICONS[chapter.icono] : Play;
          return (
            <Card key={chapter.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{chapter.titulo}</CardTitle>
                      {chapter.descripcion && (
                        <p className="text-sm text-muted-foreground mt-0.5">{chapter.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs tabular-nums">
                    {chapter.chapter_watched}/{chapter.chapter_total}
                  </Badge>
                </div>
                {chapter.chapter_total > 0 && (
                  <Progress value={chapter.chapter_progress} className="h-1.5 mt-3" />
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {chapter.videos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={video.watched}
                      onCheckedChange={() => toggleWatched(video.id, video.watched)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.titulo}</p>
                      {video.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5">{video.descripcion}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {video.duracion_minutos} min
                      </p>
                    </div>
                    {video.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPlayingVideo({ id: video.id, url: video.url, titulo: video.titulo })}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {chapter.videos.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Sin videos disponibles</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!playingVideo} onOpenChange={(open) => { if (!open) setPlayingVideo(null); }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{playingVideo?.titulo ?? 'Video de inducción'}</DialogTitle>
          </DialogHeader>
          {playingVideo && (
            <YouTubePlayer
              key={playingVideo.id}
              url={playingVideo.url}
              videoId={playingVideo.id}
              onEnded={handleVideoEnded}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
