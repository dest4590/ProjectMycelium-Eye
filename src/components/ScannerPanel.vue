<template>
    <div class="panel-content">
        <div class="controls">
            <SearchInput
                ref="startUserInputRef"
                v-model="localStartUser"
                placeholder="start user"
                :suggestions="startUserSuggestions"
                :show-suggestions="showStartUserSuggestions"
                @input="$emit('updateSuggestions', localStartUser)"
                @focus="showStartUserSuggestions = true"
                @blur="showStartUserSuggestions = false"
                @selectSuggestion="selectStartUserSuggestion"
            />
            <SearchInput
                v-model.number="localScanDepth"
                type="number"
                placeholder="depth"
                :suggestions="[]"
                :show-suggestions="false"
                :input-style="{ marginBottom: '10px' }"
            />

            <button
                @mousedown="handleScanButtonMousedown"
                :disabled="isScanningLimitReached"
                ref="scanButtonRef"
                data-scan-button
                class="button-active-feedback"
                title="hold shift for more options"
            >
                {{ scanButtonLabel }}
            </button>

            <Dropdown
                :visible="showScanTypeDropdown"
                :x="scanTypeDropdownX"
                :y="scanTypeDropdownY"
                :items="[
                    { label: 'scan followers', value: 'followers' },
                    { label: 'scan following', value: 'following' },
                    { label: 'force scan', value: 'force' },
                ]"
                @select="selectScanTypeFromDropdown"
                @close="showScanTypeDropdown = false"
                :triggerRef="scanButtonRef"
            />
        </div>
        <TaskDisplay :tasks="tasks" :statusMap="statusMap" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SearchInput from '@/components/SearchInput.vue';
import Dropdown from '@/components/Dropdown.vue';
import TaskDisplay from '@/components/TaskDisplay.vue';
import type { Task, StatusMapItem } from '@/types/global.d';

const props = defineProps<{
    startUser: string;
    scanDepth: number;
    tasks: Record<string, Task>;
    statusMap: Record<string, StatusMapItem>;
    isScanningLimitReached: boolean;
    scanButtonLabel: string;
    startUserSuggestions: string[];
}>();

const emit = defineEmits([
    'update:startUser', 
    'update:scanDepth', 
    'initiateScan', 
    'updateSuggestions',
    'selectSuggestion'
]);

const localStartUser = computed({
    get: () => props.startUser,
    set: (v) => emit('update:startUser', v)
});

const localScanDepth = computed({
    get: () => props.scanDepth,
    set: (v) => emit('update:scanDepth', v)
});

const showStartUserSuggestions = ref(false);
const showScanTypeDropdown = ref(false);
const scanTypeDropdownX = ref(0);
const scanTypeDropdownY = ref(0);
const scanButtonRef = ref<HTMLElement | null>(null);
const startUserInputRef = ref<InstanceType<typeof SearchInput> | null>(null);

const handleScanButtonMousedown = (event: MouseEvent) => {
    if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        showScanTypeDropdown.value = true;
        const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        scanTypeDropdownX.value = buttonRect.left;
        scanTypeDropdownY.value = buttonRect.bottom + 5;
    } else {
        showScanTypeDropdown.value = false;
        emit('initiateScan', 'default');
    }
};

const selectScanTypeFromDropdown = (type: string) => {
    showScanTypeDropdown.value = false;
    emit('initiateScan', type);
};

const selectStartUserSuggestion = (s: string) => {
    emit('selectSuggestion', s);
    showStartUserSuggestions.value = false;
};

defineExpose({
    focus: () => startUserInputRef.value?.focus()
});
</script>