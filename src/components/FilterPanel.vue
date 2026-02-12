<template>
    <div class="filter-panel">
        <div class="filter-input-wrapper">
            <input
                ref="inputRef"
                :value="modelValue"
                @input="handleInput"
                @focus="showSuggestions = true"
                @blur="handleBlur"
                @keydown.down.prevent="navigateSuggestions(1)"
                @keydown.up.prevent="navigateSuggestions(-1)"
                @keydown.enter.prevent="acceptCurrentSuggestion"
                @keydown.tab.prevent="acceptCurrentSuggestion"
                @keyup.enter="$emit('apply')"
                placeholder="filter... ( / )"
            />
            <transition name="context-menu-anim">
                <div
                    v-if="
                        showSuggestions &&
                        (filteredHints.length > 0 || modelValue.trim() === '')
                    "
                    class="filter-hints"
                >
                    <ul v-if="filteredHints.length > 0">
                        <li
                            v-for="(hint, index) in filteredHints"
                            :key="hint.text"
                            :class="{ active: index === activeIndex }"
                            @mousedown.prevent="selectHint(hint.text)"
                        >
                            <code>{{ hint.text }}</code>
                            <span>- {{ hint.description }}</span>
                        </li>
                    </ul>

                    <div v-else>
                        <div class="context-menu-header">filter syntax</div>
                        <div class="hint-body">
                            <p>
                                <code>[metric] [operator] [value]</code>
                            </p>
                            <div class="context-menu-section">examples</div>
                            <ul>
                                <li
                                    @mousedown.prevent="
                                        selectHint('degree > 10')
                                    "
                                >
                                    <code>degree &gt; 10</code>
                                </li>
                                <li
                                    @mousedown.prevent="
                                        selectHint('label contains user')
                                    "
                                >
                                    <code>label contains user</code>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
        <button @click="$emit('apply')" class="button-active-feedback">
            apply
        </button>
        <button @click="$emit('reset')" class="button-active-feedback">
            reset
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';

type Hint = { text: string; type: 'metric' | 'operator'; description: string };

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'apply'): void;
    (e: 'reset'): void;
}>();

const showSuggestions = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const activeIndex = ref(-1);

const focus = () => {
    nextTick(() => inputRef.value?.focus());
};

defineExpose({ focus });

const allHints: Hint[] = [
    { text: 'label', type: 'metric', description: 'node name' },
    { text: 'degree', type: 'metric', description: 'total connections' },
    { text: 'in-degree', type: 'metric', description: 'incoming connections' },
    { text: 'out-degree', type: 'metric', description: 'outgoing connections' },
    { text: '>', type: 'operator', description: 'greater than' },
    { text: '<', type: 'operator', description: 'less than' },
    { text: '=', type: 'operator', description: 'equals' },
    { text: 'contains', type: 'operator', description: 'contains text' },
];

const filteredHints = computed<Hint[]>(() => {
    const parts = props.modelValue
        .trim()
        .split(' ')
        .filter((p) => p);
    const lastPart = props.modelValue.slice(
        props.modelValue.lastIndexOf(' ') + 1
    );

    if (
        parts.length === 0 ||
        (parts.length === 1 && props.modelValue.slice(-1) !== ' ')
    ) {
        return allHints.filter(
            (h) => h.type === 'metric' && h.text.startsWith(lastPart)
        );
    }

    if (parts.length === 1 && props.modelValue.slice(-1) === ' ') {
        const metric = parts[0];
        if (metric === 'label') {
            return allHints.filter((h) => h.text === 'contains');
        } else if (['degree', 'in-degree', 'out-degree'].includes(metric)) {
            return allHints.filter((h) => ['>', '<', '='].includes(h.text));
        }
    }

    if (parts.length === 2 && props.modelValue.slice(-1) !== ' ') {
        const metric = parts[0];
        if (metric === 'label') {
            return allHints.filter(
                (h) => h.text === 'contains' && h.text.startsWith(lastPart)
            );
        } else if (['degree', 'in-degree', 'out-degree'].includes(metric)) {
            return allHints.filter(
                (h) =>
                    ['>', '<', '='].includes(h.text) &&
                    h.text.startsWith(lastPart)
            );
        }
    }

    return [];
});

watch(
    filteredHints,
    (newHints) => {
        activeIndex.value = newHints.length > 0 ? 0 : -1;
    },
    { immediate: true }
);

const handleInput = (event: Event) => {
    emit('update:modelValue', (event.target as HTMLInputElement).value);
    activeIndex.value = -1;
};

const handleBlur = () => {
    setTimeout(() => {
        showSuggestions.value = false;
        activeIndex.value = -1;
    }, 150);
};

const navigateSuggestions = (direction: 1 | -1) => {
    if (filteredHints.value.length === 0) return;
    activeIndex.value =
        activeIndex.value === -1 ? 0 : activeIndex.value + direction;
    if (activeIndex.value < 0) {
        activeIndex.value = filteredHints.value.length - 1;
    }
    if (activeIndex.value >= filteredHints.value.length) {
        activeIndex.value = 0;
    }
};

const selectHint = (hintText: string) => {
    const parts = props.modelValue
        .trim()
        .split(' ')
        .filter((p) => p);
    let newValue = props.modelValue;

    if (hintText.includes(' ')) {
        newValue = hintText;
    } else {
        const lastSpaceIndex = props.modelValue.lastIndexOf(' ');
        if (lastSpaceIndex === -1) {
            newValue = hintText + ' ';
        } else {
            newValue =
                props.modelValue.slice(0, lastSpaceIndex + 1) + hintText + ' ';
        }
    }

    emit('update:modelValue', newValue);

    nextTick(() => {
        inputRef.value?.focus();
    });
};

const acceptCurrentSuggestion = () => {
    if (activeIndex.value !== -1 && filteredHints.value[activeIndex.value]) {
        selectHint(filteredHints.value[activeIndex.value].text);
    }
};
</script>

<style scoped>
.filter-panel {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background-color: rgba(36, 36, 36, 0.95);
    padding: 10px;
    display: flex;
    gap: 10px;
    align-items: center;
    z-index: 10;
    border-bottom: 1px solid #444;
}
.filter-input-wrapper {
    flex-grow: 1;
    position: relative;
}
.filter-panel input {
    width: 100%;
    margin-bottom: 0;
}
.filter-panel button {
    width: auto;
    flex-shrink: 0;
    margin-bottom: 0;
}

.filter-hints {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    width: 300px;
    background-color: #2c2c2c;
    border: 1px solid #555;
    border-radius: 5px;
    z-index: 10001;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    color: #e0e0e0;
    padding: 5px 0;
    transform-origin: top left;
}
.filter-hints ul {
    list-style: none;
    padding: 0;
    margin: 0;
}
.filter-hints li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.filter-hints li:hover,
.filter-hints li.active {
    background-color: #444;
    color: #7be141;
}
.filter-hints li code {
    font-weight: bold;
}
.filter-hints li span {
    font-size: 11px;
    color: #999;
}
.filter-hints li:hover span,
.filter-hints li.active span {
    color: #aaa;
}

.hint-body {
    padding: 0 12px 8px 12px;
}
.hint-body p {
    margin: 5px 0 15px;
    background-color: #3a3a3a;
    padding: 5px;
    border-radius: 3px;
    text-align: center;
}
.hint-body ul {
    list-style: none;
    padding: 0;
    margin: 5px 0 10px;
}
.hint-body li {
    padding: 6px;
    border-radius: 3px;
    cursor: pointer;
}
.hint-body li:hover {
    background-color: #444;
    color: #7be141;
}
.hint-body code {
    color: #f0a30a;
}

.context-menu-header {
    padding: 8px 12px;
    font-weight: bold;
    color: #7be141;
    border-bottom: 1px solid #444;
    margin-bottom: 5px;
}
.context-menu-section {
    padding-top: 8px;
    font-size: 11px;
    text-transform: uppercase;
    color: #999;
}
</style>
