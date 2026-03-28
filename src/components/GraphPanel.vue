<template>
    <div class="graph-panel">
        <FilterPanel
            ref="filterPanelRef"
            :modelValue="filterQuery"
            @update:modelValue="$emit('update:filterQuery', $event)"
            @apply="$emit('applyFilter')"
            @reset="$emit('resetFilter')"
        />
        <GraphControls
            :physicsEnabled="physicsEnabled"
            @zoom-in="$emit('zoomIn')"
            @zoom-out="$emit('zoomOut')"
            @fit="$emit('fitGraph')"
            @toggle-physics="$emit('togglePhysics')"
            @reset-view="$emit('resetGraphView')"
        />
        <div class="watermark"><img src="@/assets/Eye_of_Ra.png" /></div>
        <div ref="graphContainer" class="graph-container"></div>

        <transition name="context-menu-anim">
            <div
                v-if="contextMenu.visible"
                class="context-menu"
                :style="{
                    top: contextMenu.y + 'px',
                    left: contextMenu.x + 'px',
                }"
                @click.stop
                ref="contextMenuRef"
            >
                <div
                    class="context-menu-header"
                    style="cursor: pointer"
                    @click="$emit('executeContextMenuAction', 'copy')"
                    title="copy username"
                >
                    {{ contextMenu.nodeId }}
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-section">actions</div>
                <div
                    class="context-menu-item"
                    @click="$emit('executeContextMenuAction', 'expand')"
                >
                    expand node
                </div>
                <div
                    class="context-menu-item"
                    @click="$emit('executeContextMenuAction', 'highlight')"
                >
                    highlight neighbors
                </div>
                <div
                    class="context-menu-item"
                    @click="$emit('executeContextMenuAction', 'open')"
                >
                    open in Instagram
                </div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-section">pathfinding</div>
                <div
                    class="context-menu-item"
                    @click="$emit('executeContextMenuAction', 'setAsPathStart')"
                >
                    set as start
                </div>
                <div
                    class="context-menu-item"
                    @click="$emit('executeContextMenuAction', 'setAsPathEnd')"
                >
                    set as end
                </div>
                <div class="context-menu-separator"></div>
                <div
                    class="context-menu-item"
                    @click="
                        $emit('executeContextMenuAction', 'markAsNotScanned')
                    "
                >
                    mark as unscanned
                </div>
                <div
                    class="context-menu-item"
                    @click="$emit('executeContextMenuAction', 'toggleHide')"
                >
                    {{
                        contextMenu.nodeId && isNodeHidden(contextMenu.nodeId)
                            ? 'show node'
                            : 'hide node'
                    }}
                </div>
                <div
                    class="context-menu-item danger"
                    @click="$emit('executeContextMenuAction', 'delete')"
                >
                    delete node
                </div>

                <div
                    class="context-menu-section"
                    v-if="contextMenu.connectedNodes.length > 0"
                >
                    connected nodes ({{ contextMenu.connectedNodes.length }})
                </div>
                <div class="context-menu-list">
                    <div
                        v-for="node in contextMenu.connectedNodes"
                        :key="node"
                        class="context-menu-item-small"
                        @click="$emit('focusOnNode', node)"
                    >
                        {{ node }}
                    </div>
                </div>
            </div>
        </transition>

        <transition name="context-menu-anim">
            <div
                v-if="hoverTooltip.visible"
                class="hover-tooltip"
                :style="{
                    top: hoverTooltip.y + 'px',
                    left: hoverTooltip.x + 'px',
                }"
            >
                <a
                    :href="'https://instagram.com/' + hoverTooltip.nodeId"
                    target="_blank"
                    style="color: inherit; text-decoration: none"
                >
                    <strong>{{ hoverTooltip.label }}</strong>
                    <span
                        :style="{
                            color: hoverTooltip.isScanned
                                ? '#7BE141'
                                : '#F0A30A',
                            marginLeft: '5px',
                        }"
                    >
                        ({{ hoverTooltip.isScanned ? 'scanned' : 'unscanned' }})
                    </span>
                </a>
                <div v-if="hoverTooltip.lastScanned" style="font-size: 12px; margin-top: 4px; opacity: 0.85">
                    Last scanned: {{ hoverTooltip.lastScanned }}
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import FilterPanel from '@/components/FilterPanel.vue';
import GraphControls from '@/components/GraphControls.vue';
import type { ContextMenuState, HoverTooltipState } from '@/types/global.d';

const props = defineProps<{
    filterQuery: string;
    physicsEnabled: boolean;
    contextMenu: ContextMenuState;
    hoverTooltip: HoverTooltipState;
    isNodeHidden: (nodeId: string) => boolean;
}>();

const emit = defineEmits([
    'update:filterQuery',
    'applyFilter',
    'resetFilter',
    'zoomIn',
    'zoomOut',
    'fitGraph',
    'togglePhysics',
    'resetGraphView',
    'executeContextMenuAction',
    'focusOnNode',
]);

const graphContainer = ref<HTMLElement | null>(null);
const contextMenuRef = ref<HTMLElement | null>(null);
const filterPanelRef = ref<InstanceType<typeof FilterPanel> | null>(null);

const handleContextMenuClickOutside = (event: MouseEvent) => {
    if (!props.contextMenu.visible) return;
    const target = event.target as Node;
    const menuEl = contextMenuRef.value;
    if (menuEl && menuEl.contains(target)) return;
    emit('executeContextMenuAction', 'close');
};

watch(
    () => props.contextMenu.visible,
    (newVal: boolean) => {
        if (newVal) {
            window.addEventListener('mousedown', handleContextMenuClickOutside);
        } else {
            window.removeEventListener(
                'mousedown',
                handleContextMenuClickOutside,
            );
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    window.removeEventListener('mousedown', handleContextMenuClickOutside);
});

defineExpose({
    graphContainer,
    filterPanelRef,
});
</script>
