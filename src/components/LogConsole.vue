<template>
    <div class="logs" ref="logsContainer">
        <div
            v-for="(log, i) in logs.slice().reverse()"
            :key="i"
            v-html="log"
        ></div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
    logs: string[];
}>();

const logsContainer = ref<HTMLElement | null>(null);

watch(
    () => props.logs.length,
    async () => {
        await nextTick();
        if (logsContainer.value) {
            logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
        }
    }
);
</script>

<style scoped>
.logs {
    margin-top: 20px;
    flex-grow: 1;
    background-color: #1a1a1a;
    border: 1px solid #444;
    padding: 10px;
    font-size: 12px;
    display: flex;
    flex-direction: column-reverse;
    overflow-y: auto;
}
</style>