<?php

namespace App\Http\Controllers;

use App\Models\Diagram;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Traits\HasResponseService;

class DiagramController extends Controller
{
    use HasResponseService;

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Diagram::with('creator:id,name,email')
                ->active()
                ->orderBy('updated_at', 'desc');

            if ($request->filled('search')) {
                $query->search($request->input('search'));
            }

            if ($request->filled('tags')) {
                $tags = is_array($request->input('tags'))
                    ? $request->input('tags')
                    : explode(',', $request->input('tags'));
                $query->withTags($tags);
            }

            if ($request->boolean('my_diagrams')) {
                $query->where('created_by', Auth::id());
            }

            $diagrams = $query->paginate($request->input('per_page', 15));

            return $this->responseService()->success('Diagrams retrieved successfully', 200, $diagrams);
        } catch (\Exception $e) {
            return $this->responseService()->error('Failed to retrieve diagrams: ' . $e->getMessage(), 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'data' => 'required|array',
                'data.nodes' => 'nullable|array',
                'data.connections' => 'nullable|array',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50'
            ]);

            $validated['created_by'] = Auth::id();
            $validated['version'] = 1;

            $diagram = Diagram::create($validated);
            $diagram->load('creator:id,name,email');

            return $this->responseService()->success('Diagram created successfully', 201, $diagram);
        } catch (ValidationException $e) {
            return $this->responseService()->error('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            return $this->responseService()->error('Failed to create diagram: ' . $e->getMessage(), 500);
        }
    }

    public function show(Diagram $diagram): JsonResponse
    {
        try {
            $diagram->load('creator:id,name,email');
            return $this->responseService()->success('Diagram retrieved successfully', 200, $diagram);
        } catch (\Exception $e) {
            return $this->responseService()->error('Failed to retrieve diagram: ' . $e->getMessage(), 500);
        }
    }

    public function update(Request $request, Diagram $diagram): JsonResponse
    {
        try {
            if ($diagram->created_by !== Auth::id()) {
                return $this->responseService()->error('Unauthorized to update this diagram', 403);
            }

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'data' => 'sometimes|required|array',
                'data.nodes' => 'nullable|array',
                'data.connections' => 'nullable|array',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50'
            ]);

            if (isset($validated['data'])) {
                $validated['version'] = $diagram->version + 1;
            }

            $diagram->update($validated);
            $diagram->load('creator:id,name,email');

            return $this->responseService()->success('Diagram updated successfully', 200, $diagram);
        } catch (ValidationException $e) {
            return $this->responseService()->error('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            return $this->responseService()->error('Failed to update diagram: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Diagram $diagram): JsonResponse
    {
        try {
            if ($diagram->created_by !== Auth::id()) {
                return $this->responseService()->error('Unauthorized to delete this diagram', 403);
            }

            $diagram->update(['is_active' => false]);

            return $this->responseService()->success('Diagram deleted successfully');
        } catch (\Exception $e) {
            return $this->responseService()->error('Failed to delete diagram: ' . $e->getMessage(), 500);
        }
    }
}
