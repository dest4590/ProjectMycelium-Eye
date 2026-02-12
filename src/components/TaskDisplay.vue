<template>
    <div class="tasks-container" v-if="Object.keys(tasks).length > 0">
        <hr />
        <h4>active tasks:</h4>
        <div
            class="task-item"
            v-for="(task, taskId) in tasks"
            :key="taskId"
        >
            <span class="task-user">{{ task.startUser }}</span>
            <span
                class="task-status"
                :class="statusMap[task.status]?.class || 'queued'"
            >
                {{ statusMap[task.status]?.text || 'queued' }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Task, StatusMapItem } from '@/types/global.d';
import type { PropType } from 'vue';

defineProps<{
    tasks: Record<string, Task>;
    statusMap: Record<string, StatusMapItem>;
}>();
</script>

<style scoped>
.tasks-container {
    margin-top: 1rem;
}

.tasks-container h4 {
    margin-bottom: 0.5rem;
    color: #aaa;
    text-transform: uppercase;
    font-size: 12px;
}

.task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #333;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 5px;
    font-size: 14px;
}

.task-user {
    font-weight: bold;
    color: #e0e0e0;
}

.task-status {
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
}

.task-status.queued {
    background-color: #f0a30a;
    color: #1a1a1a;
}
.task-status.scanning {
    background-color: #3498db;
    color: #fff;
}
.task-status.completed {
    background-color: #7be141;
    color: #1a1a1a;
}
.task-status.failed {
    background-color: #ff5555;
    color: #fff;
}
hr {
    border: 1px solid #444;
    width: 100%;
    margin: 15px 0;
}
</style>