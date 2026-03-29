<template>
    <div class="graph-controls">
        <button
            class="control-btn"
            @click="$emit('zoom-in')"
            title="Zoom in (Ctrl + +)"
        >
            <span class="control-icon">+</span>
        </button>
        <button
            class="control-btn"
            @click="$emit('zoom-out')"
            title="Zoom out (Ctrl + -)"
        >
            <span class="control-icon">−</span>
        </button>
        <button
            class="control-btn"
            @click="$emit('fit')"
            title="Fit graph (F)"
        >
            <span class="control-icon">⤢</span>
        </button>
        <div class="control-divider"></div>
        <button
            class="control-btn"
            :class="{ active: physicsEnabled }"
            @click="$emit('toggle-physics')"
            title="Toggle physics (Space)"
        >
            <span class="control-icon">{{ physicsEnabled ? '⏸' : '▶' }}</span>
        </button>
        <div class="control-divider"></div>
        <button
            class="control-btn"
            @click="$emit('reset-view')"
            title="Reset view"
        >
            <span class="control-icon">↺</span>
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    physicsEnabled: boolean;
}>();

defineEmits<{
    (e: 'zoom-in'): void;
    (e: 'zoom-out'): void;
    (e: 'fit'): void;
    (e: 'toggle-physics'): void;
    (e: 'reset-view'): void;
}>();
</script>

<style scoped>
.graph-controls {
    position: absolute;
    bottom: 20px;
    left: 20px;
    display: flex;
    gap: 4px;
    background-color: rgba(36, 36, 36, 0.95);
    border: 1px solid #555;
    border-radius: 6px;
    padding: 6px;
    z-index: 100;
}

.control-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    background-color: #333;
    border: 1px solid #555;
    border-radius: 4px;
    color: #e0e0e0;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
}

.control-btn:hover {
    background-color: #444;
    border-color: #7be141;
    transform: scale(1.05);
}

.control-btn.active {
    background-color: #7be141;
    color: #1a1a1a;
    border-color: #7be141;
}

.control-btn:active {
    transform: scale(0.95);
}

.control-icon {
    font-size: 18px;
    line-height: 1;
}

.control-divider {
    width: 1px;
    background-color: #555;
    margin: 4px 2px;
}
</style>
