<template>
    <div class="panel-content">
        <div class="controls">
            <div class="controls-header">
                <span>node search</span>
                <button @click="$emit('resetSearch')" class="link-button">
                    reset
                </button>
            </div>
            <SearchInput
                ref="searchInputRef"
                v-model="localSearchQuery"
                placeholder="find user... ( / )"
                :suggestions="searchSuggestions"
                :show-suggestions="showSuggestions"
                @input="$emit('updateSearchSuggestions', localSearchQuery)"
                @focus="showSuggestions = true"
                @blur="showSuggestions = false"
                @selectSuggestion="selectSearchSuggestion"
                @keyup.enter="$emit('searchNode')"
                :input-style="{ marginBottom: '0' }"
            />
            <hr />
            <div class="controls-header">
                <span>shortest path</span>
                <button @click="$emit('resetPath')" class="link-button">
                    reset
                </button>
            </div>
            <SearchInput
                v-model="localPathStart"
                placeholder="from user... (node click)"
                :suggestions="pathStartSuggestions"
                :show-suggestions="showPathStartSuggestions"
                @input="$emit('updatePathStartSuggestions', localPathStart)"
                @focus="showPathStartSuggestions = true"
                @blur="showPathStartSuggestions = false"
                @selectSuggestion="selectPathStartSuggestion"
            />
            <SearchInput
                v-model="localPathEnd"
                placeholder="to user... (shift+click)"
                :suggestions="pathEndSuggestions"
                :show-suggestions="showPathEndSuggestions"
                @input="$emit('updatePathEndSuggestions', localPathEnd)"
                @focus="showPathEndSuggestions = true"
                @blur="showPathEndSuggestions = false"
                @selectSuggestion="selectPathEndSuggestion"
            />
            <button
                @click="$emit('findPath')"
                :disabled="!activeProject"
                class="button-active-feedback"
            >
                find path
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SearchInput from '@/components/SearchInput.vue';

const props = defineProps<{
    searchQuery: string;
    pathStart: string;
    pathEnd: string;
    searchSuggestions: string[];
    pathStartSuggestions: string[];
    pathEndSuggestions: string[];
    activeProject: string | null;
}>();

const emit = defineEmits([
    'update:searchQuery',
    'update:pathStart',
    'update:pathEnd',
    'updateSearchSuggestions',
    'updatePathStartSuggestions',
    'updatePathEndSuggestions',
    'selectSearchSuggestion',
    'selectPathStartSuggestion',
    'selectPathEndSuggestion',
    'searchNode',
    'findPath',
    'resetSearch',
    'resetPath',
]);

const localSearchQuery = computed({
    get: () => props.searchQuery,
    set: (v) => emit('update:searchQuery', v),
});
const localPathStart = computed({
    get: () => props.pathStart,
    set: (v) => emit('update:pathStart', v),
});
const localPathEnd = computed({
    get: () => props.pathEnd,
    set: (v) => emit('update:pathEnd', v),
});

const showSuggestions = ref(false);
const showPathStartSuggestions = ref(false);
const showPathEndSuggestions = ref(false);
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null);

const selectSearchSuggestion = (s: string) => {
    emit('selectSearchSuggestion', s);
    showSuggestions.value = false;
};
const selectPathStartSuggestion = (s: string) => {
    emit('selectPathStartSuggestion', s);
    showPathStartSuggestions.value = false;
};
const selectPathEndSuggestion = (s: string) => {
    emit('selectPathEndSuggestion', s);
    showPathEndSuggestions.value = false;
};

defineExpose({
    focus: () => searchInputRef.value?.focus(),
});
</script>
