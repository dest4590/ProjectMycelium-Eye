<template>
    <div class="project-selector" :style="activeProject ? { borderBottom: '1px solid #444' } : {}">
        <select
            v-model="localActiveProject"
            @mousedown="handleProjectSelectMousedown"
            ref="projectSelectRef"
            data-project-input
        >
            <option v-for="p in projects" :key="p" :value="p">
                {{ p }}
            </option>
        </select>
        <Dropdown
            :visible="showProjectDropdown"
            :x="projectDropdownX"
            :y="projectDropdownY"
            :items="[
                {
                    label: 'delete active project',
                    value: 'delete',
                    isDanger: true,
                },
            ]"
            @select="handleDropdownSelect"
            @close="showProjectDropdown = false"
            :triggerRef="projectSelectRef"
        />
        <div class="new-project">
            <input
                v-model="newProjectName"
                @keyup.enter="createProject"
                placeholder="new project..."
                aria-label="New project name"
            />
            <div style="display: flex; gap: 6px; width: 40px">
                <button
                    @click="createProject"
                    class="button-active-feedback"
                    aria-label="Create project"
                    title="Create project"
                >
                    +
                </button>
                <button
                    v-if="newProjectName"
                    @click="newProjectName = ''"
                    class="button-active-feedback"
                    aria-label="Clear"
                    title="Clear"
                >
                    ×
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Dropdown from '@/components/Dropdown.vue';

const props = defineProps<{
    projects: string[];
    activeProject: string | null;
}>();

const emit = defineEmits(['update:activeProject', 'create', 'delete']);

const newProjectName = ref('');
const showProjectDropdown = ref(false);
const projectDropdownX = ref(0);
const projectDropdownY = ref(0);
const projectSelectRef = ref<HTMLElement | null>(null);

const localActiveProject = computed({
    get: () => props.activeProject,
    set: (val) => emit('update:activeProject', val)
});

const handleProjectSelectMousedown = (event: MouseEvent) => {
    if (event.shiftKey && props.activeProject) {
        event.preventDefault();
        event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        projectDropdownX.value = rect.left;
        projectDropdownY.value = rect.bottom + 5;
        showProjectDropdown.value = true;
    }
};

const handleDropdownSelect = (val: string) => {
    if (val === 'delete') {
        emit('delete');
    }
    showProjectDropdown.value = false;
};

const createProject = () => {
    if (newProjectName.value) {
        emit('create', newProjectName.value);
        newProjectName.value = '';
    }
};
</script>