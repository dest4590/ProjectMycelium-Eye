<template>
    <div class="panel-content">
        <div class="controls">
            <div class="filter-control">
                <input
                    type="checkbox"
                    id="hideSingles"
                    v-model="localHideSingleConnections"
                />
                <label for="hideSingles">hide "hanging" nodes</label>
            </div>
            <div class="scan-max-control">
                <label for="maxFollowersLimit">max followers per user</label>
                <input
                    type="number"
                    id="maxFollowersLimit"
                    v-model="localMaxFollowersLimit"
                    @change="onLimitChange('followers', localMaxFollowersLimit)"
                />

                <label for="maxFollowingLimit">max following per user</label>
                <input
                    type="number"
                    id="maxFollowingLimit"
                    v-model="localMaxFollowingLimit"
                    @change="onLimitChange('following', localMaxFollowingLimit)"
                />
            </div>
            <hr />
            <button
                @click="$emit('expandAllNodes')"
                :disabled="isScanning || !activeProject"
                class="button-active-feedback"
                title="loads all data from database, may take time"
            >
                show full graph
                <span style="color: red">(!!! dangerous !!!)</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    hideSingleConnections: boolean;
    maxFollowersLimit: number | null;
    maxFollowingLimit: number | null;
    isScanning: boolean;
    activeProject: string | null;
}>();

const emit = defineEmits([
    'update:hideSingleConnections',
    'update:maxFollowersLimit',
    'update:maxFollowingLimit',
    'setLimit',
    'expandAllNodes'
]);

const localHideSingleConnections = computed({ get: () => props.hideSingleConnections, set: (v) => emit('update:hideSingleConnections', v) });
const localMaxFollowersLimit = computed({ get: () => props.maxFollowersLimit, set: (v) => emit('update:maxFollowersLimit', v) });
const localMaxFollowingLimit = computed({ get: () => props.maxFollowingLimit, set: (v) => emit('update:maxFollowingLimit', v) });

const onLimitChange = (type: string, value: number | null) => {
    if (value !== null) {
        emit('setLimit', type, value);
    }
};
</script>