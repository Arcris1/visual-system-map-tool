<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Diagram extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'data',
        'tags',
        'created_by',
        'version',
        'is_active'
    ];

    protected $casts = [
        'data' => 'array',
        'tags' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created this diagram
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get only active diagrams
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to search diagrams by title or description
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    /**
     * Scope to filter by tags
     */
    public function scopeWithTags($query, array $tags)
    {
        return $query->whereJsonContains('tags', $tags);
    }

    /**
     * Get all nodes from the diagram data
     */
    public function getNodesAttribute()
    {
        return $this->data['nodes'] ?? [];
    }

    /**
     * Get all connections from the diagram data
     */
    public function getConnectionsAttribute()
    {
        return $this->data['connections'] ?? [];
    }

    /**
     * Get nodes that have technical details (variables, parameters, arguments, or payloads)
     */
    public function getNodesWithTechnicalDetailsAttribute()
    {
        $nodes = $this->nodes;

        return collect($nodes)->filter(function ($node) {
            $details = $node['details'] ?? [];
            return !empty($details['variables'])
                || !empty($details['parameters'])
                || !empty($details['arguments'])
                || !empty($details['payloads']);
        })->values()->all();
    }

    /**
     * Count total technical items across all nodes
     */
    public function getTechnicalItemsCountAttribute()
    {
        $nodes = $this->nodes;
        $count = 0;

        foreach ($nodes as $node) {
            $details = $node['details'] ?? [];
            $count += count($details['variables'] ?? []);
            $count += count($details['parameters'] ?? []);
            $count += count($details['arguments'] ?? []);
            $count += count($details['payloads'] ?? []);
        }

        return $count;
    }

    /**
     * Get statistics about technical details in the diagram
     */
    public function getTechnicalStatsAttribute()
    {
        $nodes = $this->nodes;
        $stats = [
            'total_nodes' => count($nodes),
            'nodes_with_details' => 0,
            'total_variables' => 0,
            'total_parameters' => 0,
            'total_arguments' => 0,
            'total_payloads' => 0,
            'incoming_payloads' => 0,
            'outgoing_payloads' => 0,
        ];

        foreach ($nodes as $node) {
            $details = $node['details'] ?? [];

            $hasDetails = !empty($details['variables'])
                || !empty($details['parameters'])
                || !empty($details['arguments'])
                || !empty($details['payloads']);

            if ($hasDetails) {
                $stats['nodes_with_details']++;
            }

            $stats['total_variables'] += count($details['variables'] ?? []);
            $stats['total_parameters'] += count($details['parameters'] ?? []);
            $stats['total_arguments'] += count($details['arguments'] ?? []);
            $stats['total_payloads'] += count($details['payloads'] ?? []);

            foreach ($details['payloads'] ?? [] as $payload) {
                if (($payload['direction'] ?? '') === 'incoming') {
                    $stats['incoming_payloads']++;
                } elseif (($payload['direction'] ?? '') === 'outgoing') {
                    $stats['outgoing_payloads']++;
                }
            }
        }

        return $stats;
    }

    /**
     * Search nodes by technical details
     */
    public function scopeWithTechnicalDetail($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->whereRaw("JSON_SEARCH(data, 'one', ?, NULL, '$.nodes[*].details.variables[*].name') IS NOT NULL", ["%{$search}%"])
              ->orWhereRaw("JSON_SEARCH(data, 'one', ?, NULL, '$.nodes[*].details.parameters[*].name') IS NOT NULL", ["%{$search}%"])
              ->orWhereRaw("JSON_SEARCH(data, 'one', ?, NULL, '$.nodes[*].details.arguments[*].name') IS NOT NULL", ["%{$search}%"]);
        });
    }
}
