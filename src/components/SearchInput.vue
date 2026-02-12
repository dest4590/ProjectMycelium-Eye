<template>
    <div class="search-container">
        <input
            ref="inputElement"
            :value="modelValue"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            @keyup.enter="handleEnter"
            :placeholder="placeholder"
            :type="type"
            :style="inputStyle"
        />
        <div
            v-if="showSuggestions && suggestions.length > 0"
            class="suggestions"
        >
            <div
                v-for="suggestion in suggestions.slice(0, 10)"
                :key="suggestion"
                @mousedown.prevent="selectSuggestion(suggestion)"
                class="suggestion-item"
            >
                {{ suggestion }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';

const inputElement = ref<HTMLInputElement | null>(null);

const focus = () => {
    inputElement.value?.focus();
};

defineExpose({
    focus,
});

const props = defineProps({
    modelValue: {
        type: [String, Number] as PropType<string | number>,
        default: '',
    },
    placeholder: {
        type: String,
        default: '',
    },
    suggestions: {
        type: Array as PropType<string[]>,
        default: () => [],
    },
    showSuggestions: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String as PropType<'text' | 'number'>,
        default: 'text',
    },
    inputStyle: {
        type: Object as PropType<Record<string, string>>,
        default: () => ({}),
    },
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void;
    (e: 'update:showSuggestions', value: boolean): void;
    (e: 'selectSuggestion', value: string): void;
    (e: 'input', value: string | number): void;
    (e: 'focus'): void;
    (e: 'blur'): void;
    (e: 'keyup.enter'): void;
}>();

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    let value: string | number = target.value;
    if (props.type === 'number') {
        value = parseFloat(value);
        if (isNaN(value)) value = 0;
    }
    emit('update:modelValue', value);
    emit('input', value);
};

const handleFocus = () => {
    emit('update:showSuggestions', true);
    emit('focus');
};

const handleBlur = () => {
    setTimeout(() => {
        emit('update:showSuggestions', false);
        emit('blur');
    }, 150);
};

const selectSuggestion = (suggestion: string) => {
    emit('update:modelValue', suggestion);
    emit('selectSuggestion', suggestion);
    emit('update:showSuggestions', false);
};

const handleEnter = () => {
    emit('keyup.enter');
};
</script>

<style scoped>
.search-container {
    position: relative;
    width: 100%;
}
.search-container input {
    margin-bottom: 10px;
    width: 100%;
    padding: 8px;
    background-color: #333;
    border: 1px solid #555;
    color: #e0e0e0;
    border-radius: 4px;
    box-sizing: border-box;
}
.suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #333;
    border: 1px solid #555;
    border-top: none;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    border-radius: 0 0 4px 4px;
}
.suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #444;
    color: #e0e0e0;
    font-size: 12px;
}
.suggestion-item:hover {
    background: #444;
    color: #7be141;
}
.suggestion-item:last-child {
    border-bottom: none;
}
</style>
