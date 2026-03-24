<template>
    <div class="stats" v-if="activeProject">
        <div v-if="selectedNode" class="selected-info">
            selected:
            <a
                :href="'https://instagram.com/' + selectedNode"
                target="_blank"
                >{{ selectedNode }}</a
            >
        </div>
        <div>
            nodes (total): <span>{{ stats.nodes }}</span>
        </div>
        <div>
            edges (total): <span>{{ stats.edges }}</span>
        </div>
        <div>
            nodes (on graph): <span>{{ stats.nodesOnGraph }}</span>
        </div>
        <div>
            status: <span :class="wsStatus">{{ wsStatus }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    activeProject: string | null;
    selectedNode: string | null;
    stats: { nodes: number; edges: number; nodesOnGraph: number };
    wsStatus: string;
}>();
</script>
