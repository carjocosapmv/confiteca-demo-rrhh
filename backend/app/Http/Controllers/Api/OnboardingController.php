<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnboardingChapter;
use App\Models\OnboardingProgress;
use App\Models\OnboardingVideo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function assignedUsers(): JsonResponse
    {
        $users = User::orderBy('email')->get(['id', 'display_name', 'email', 'onboarding_assigned']);
        return response()->json($users);
    }

    public function toggleAssignment(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'assigned' => ['required', 'boolean'],
        ]);

        $user->update(['onboarding_assigned' => $validated['assigned']]);

        return response()->json([
            'message' => $validated['assigned'] ? 'Usuario asignado a inducción' : 'Usuario removido de inducción',
            'onboarding_assigned' => $validated['assigned'],
        ]);
    }

    public function videos(): JsonResponse
    {
        $user = auth()->user();

        $chapters = OnboardingChapter::where('activo', true)
            ->orderBy('orden')
            ->with(['videos' => function ($q) {
                $q->where('activo', true)->orderBy('orden');
            }])
            ->get();

        $watchedIds = OnboardingProgress::where('user_id', $user->id)
            ->pluck('video_id')
            ->toArray();

        $totalVideos = 0;
        $watchedCount = 0;

        $chapters->each(function ($chapter) use ($watchedIds, &$totalVideos, &$watchedCount) {
            $chapterVideos = $chapter->videos->map(function ($v) use ($watchedIds) {
                $v->watched = in_array($v->id, $watchedIds);
                return $v;
            });
            $chapter->setRelation('videos', $chapterVideos);

            $chapterTotal = $chapterVideos->count();
            $chapterWatched = $chapterVideos->where('watched', true)->count();
            $chapter->chapter_progress = $chapterTotal > 0 ? round(($chapterWatched / $chapterTotal) * 100) : 0;
            $chapter->chapter_watched = $chapterWatched;
            $chapter->chapter_total = $chapterTotal;

            $totalVideos += $chapterTotal;
            $watchedCount += $chapterWatched;
        });

        return response()->json([
            'chapters' => $chapters,
            'progress' => $totalVideos > 0 ? round(($watchedCount / $totalVideos) * 100) : 0,
            'total' => $totalVideos,
            'watched' => $watchedCount,
        ]);
    }

    public function markWatched(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => ['required', 'uuid', 'exists:onboarding_videos,id'],
        ]);

        OnboardingProgress::firstOrCreate([
            'user_id' => auth()->id(),
            'video_id' => $validated['video_id'],
        ]);

        return response()->json(['message' => 'Marcado como visto']);
    }

    public function markUnwatched(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => ['required', 'uuid', 'exists:onboarding_videos,id'],
        ]);

        OnboardingProgress::where('user_id', auth()->id())
            ->where('video_id', $validated['video_id'])
            ->delete();

        return response()->json(['message' => 'Marcado como no visto']);
    }

    // Admin: manage chapters
    public function adminChapters(): JsonResponse
    {
        $chapters = OnboardingChapter::orderBy('orden')
            ->with(['videos' => function ($q) {
                $q->orderBy('orden');
            }])
            ->get();
        return response()->json($chapters);
    }

    public function storeChapter(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'icono' => ['nullable', 'string', 'max:50'],
            'orden' => ['nullable', 'integer', 'min:0'],
        ]);

        $chapter = OnboardingChapter::create($validated);
        return response()->json($chapter, 201);
    }

    public function updateChapter(Request $request, OnboardingChapter $chapter): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'icono' => ['nullable', 'string', 'max:50'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'activo' => ['nullable', 'boolean'],
        ]);

        $chapter->update($validated);
        return response()->json($chapter);
    }

    public function deleteChapter(OnboardingChapter $chapter): JsonResponse
    {
        $chapter->videos()->delete();
        $chapter->delete();
        return response()->json(['message' => 'Capítulo eliminado']);
    }

    // Admin: manage videos
    public function storeVideo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'chapter_id' => ['required', 'uuid', 'exists:onboarding_chapters,id'],
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'url' => ['nullable', 'string'],
            'duracion_minutos' => ['nullable', 'integer', 'min:0'],
            'orden' => ['nullable', 'integer', 'min:0'],
        ]);

        $video = OnboardingVideo::create($validated);
        return response()->json($video, 201);
    }

    public function updateVideo(Request $request, OnboardingVideo $video): JsonResponse
    {
        $validated = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'url' => ['nullable', 'string'],
            'duracion_minutos' => ['nullable', 'integer', 'min:0'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'activo' => ['nullable', 'boolean'],
        ]);

        $video->update($validated);
        return response()->json($video);
    }

    public function deleteVideo(OnboardingVideo $video): JsonResponse
    {
        OnboardingProgress::where('video_id', $video->id)->delete();
        $video->delete();
        return response()->json(['message' => 'Video eliminado']);
    }

    // Admin: reset user progress
    public function resetUserProgress(User $user): JsonResponse
    {
        OnboardingProgress::where('user_id', $user->id)->delete();
        return response()->json(['message' => 'Progreso reiniciado']);
    }

    public function rrhhIndex(): JsonResponse
    {
        $chapters = OnboardingChapter::where('activo', true)
            ->orderBy('orden')
            ->withCount(['videos' => function ($q) {
                $q->where('activo', true);
            }])
            ->get();

        $users = User::where('onboarding_assigned', true)->get();

        $data = $users->map(function ($u) use ($chapters) {
            $allWatched = OnboardingProgress::where('user_id', $u->id)
                ->pluck('video_id')
                ->toArray();

            $totalVideos = $chapters->sum('videos_count');
            $watchedCount = count($allWatched);

            $chaptersData = $chapters->map(function ($ch) use ($allWatched) {
                $chWatched = OnboardingVideo::where('chapter_id', $ch->id)
                    ->where('activo', true)
                    ->whereIn('id', $allWatched)
                    ->count();
                return [
                    'id' => $ch->id,
                    'titulo' => $ch->titulo,
                    'total' => $ch->videos_count,
                    'watched' => $chWatched,
                ];
            });

            $watchedVideos = OnboardingProgress::where('user_id', $u->id)
                ->with('video')
                ->get()
                ->map(function ($p) {
                    return [
                        'id' => $p->video_id,
                        'titulo' => $p->video->titulo ?? '—',
                        'chapter_id' => $p->video->chapter_id ?? null,
                        'watched_at' => $p->watched_at,
                    ];
                });

            return [
                'id' => $u->id,
                'display_name' => $u->display_name,
                'email' => $u->email,
                'hire_date' => $u->hire_date,
                'progress' => $totalVideos > 0 ? round(($watchedCount / $totalVideos) * 100) : 0,
                'watched' => $watchedCount,
                'total_videos' => $totalVideos,
                'chapters' => $chaptersData,
                'videos' => $watchedVideos,
            ];
        });

        return response()->json($data);
    }
}
