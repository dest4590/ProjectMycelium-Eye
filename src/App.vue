<template>
    <div v-if="isLoading" class="preloader">
        <EyeOfRa
            class="preloader-logo"
            :class="{ 'preloader-logo-error': startupError }"
        />
        <div v-if="!startupError">
            <p>initializing system...</p>
        </div>
        <div v-else class="preloader-error">
            <h2>critical error</h2>
            <p>{{ startupError }}</p>
        </div>
    </div>

    <div id="app" v-if="!startupError">
        <div class="main-panel">
            <div class="logo-container">
                <EyeOfRa
                    class="logo"
                    :class="{ 'logo-error': wsStatus === 'error' }"
                />
                <h2>PROJECT MYCELIUM</h2>
                <span>{{ tagline }}</span>
            </div>

            <span
                v-if="!activeProject"
                style="margin-bottom: 1rem; text-align: center"
                >create a project to continue</span
            >
            <div
                class="project-selector"
                :style="activeProject ? { borderBottom: '1px solid #444' } : {}"
            >
                <select
                    v-model="activeProject"
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
                    @select="handleProjectDropdownSelect"
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

            <div class="tabs" v-if="activeProject">
                <button
                    @click="activeTab = 'scan'"
                    :class="{ active: activeTab === 'scan' }"
                    class="button-active-feedback"
                    title="scanner (alt+1)"
                >
                    scanner
                </button>
                <button
                    @click="activeTab = 'analyze'"
                    :class="{ active: activeTab === 'analyze' }"
                    class="button-active-feedback"
                    title="analysis (alt+2)"
                >
                    analysis
                </button>
                <button
                    @click="activeTab = 'settings'"
                    :class="{ active: activeTab === 'settings' }"
                    class="button-active-feedback"
                    title="settings (alt+3)"
                >
                    settings
                </button>
            </div>

            <div
                v-if="activeTab === 'scan' && activeProject"
                class="panel-content"
            >
                <div class="controls">
                    <SearchInput
                        ref="startUserInputRef"
                        v-model="startUser"
                        placeholder="start user"
                        :suggestions="startUserSuggestions"
                        :show-suggestions="showStartUserSuggestions"
                        @input="updateStartUserSuggestions"
                        @focus="showStartUserSuggestions = true"
                        @blur="showStartUserSuggestions = false"
                        @selectSuggestion="selectStartUserSuggestion"
                    />
                    <SearchInput
                        v-model.number="scanDepth"
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
                            {
                                label: 'scan followers',
                                value: 'followers',
                            },
                            {
                                label: 'scan following',
                                value: 'following',
                            },
                            {
                                label: 'force scan',
                                value: 'force',
                            },
                        ]"
                        @select="selectScanTypeFromDropdown"
                        @close="showScanTypeDropdown = false"
                        :triggerRef="scanButtonRef"
                    />
                </div>
                <TaskDisplay :tasks="tasks" :statusMap="statusMap" />
            </div>

            <div
                v-if="activeTab === 'analyze' && activeProject"
                class="panel-content"
            >
                <div class="controls">
                    <div class="controls-header">
                        <span>node search</span>
                        <button @click="resetSearch" class="link-button">
                            reset
                        </button>
                    </div>
                    <SearchInput
                        ref="searchInputRef"
                        v-model="searchQuery"
                        placeholder="find user... ( / )"
                        :suggestions="searchSuggestions"
                        :show-suggestions="showSuggestions"
                        @input="updateSearchSuggestions"
                        @focus="showSuggestions = true"
                        @blur="showSuggestions = false"
                        @selectSuggestion="selectSearchSuggestion"
                        @keyup.enter="searchNode"
                        :input-style="{ marginBottom: '0' }"
                    />
                    <hr />
                    <div class="controls-header">
                        <span>shortest path</span>
                        <button @click="resetPath" class="link-button">
                            reset
                        </button>
                    </div>
                    <SearchInput
                        v-model="pathStart"
                        placeholder="from user... (node click)"
                        :suggestions="pathStartSuggestions"
                        :show-suggestions="showPathStartSuggestions"
                        @input="updatePathStartSuggestions"
                        @focus="showPathStartSuggestions = true"
                        @blur="showPathStartSuggestions = false"
                        @selectSuggestion="selectPathStartSuggestion"
                    />
                    <SearchInput
                        v-model="pathEnd"
                        placeholder="to user... (shift+click)"
                        :suggestions="pathEndSuggestions"
                        :show-suggestions="showPathEndSuggestions"
                        @input="updatePathEndSuggestions"
                        @focus="showPathEndSuggestions = true"
                        @blur="showPathEndSuggestions = false"
                        @selectSuggestion="selectPathEndSuggestion"
                    />
                    <button
                        @click="findPath"
                        :disabled="!activeProject"
                        class="button-active-feedback"
                    >
                        find path
                    </button>
                </div>
            </div>

            <div
                v-if="activeTab === 'settings' && activeProject"
                class="panel-content"
            >
                <div class="controls">
                    <div class="filter-control">
                        <input
                            type="checkbox"
                            id="hideSingles"
                            v-model="hideSingleConnections"
                        />
                        <label for="hideSingles">hide "hanging" nodes</label>
                    </div>
                    <div class="scan-max-control">
                        <label for="maxFollowersLimit"
                            >max followers per user</label
                        >
                        <input
                            type="number"
                            id="maxFollowersLimit"
                            v-model="maxFollowersLimit"
                            @change="
                                maxFollowersLimit !== null &&
                                    setLimit('followers', maxFollowersLimit)
                            "
                        />

                        <label for="maxFollowingLimit"
                            >max following per user</label
                        >
                        <input
                            type="number"
                            id="maxFollowingLimit"
                            v-model="maxFollowingLimit"
                            @change="
                                maxFollowingLimit !== null &&
                                    setLimit('following', maxFollowingLimit)
                            "
                        />
                    </div>
                    <hr />
                    <button
                        @click="expandAllNodes"
                        :disabled="isScanning || !activeProject"
                        class="button-active-feedback"
                        title="loads all data from database, may take time"
                    >
                        show full graph
                        <span style="color: red">(!!! dangerous !!!)</span>
                    </button>
                </div>
            </div>

            <div class="stats" v-if="activeProject">
                <div v-if="selectedNode" class="selected-info">
                    selected:
                    <a
                        :href="'https://instagram.com/' + selectedNode"
                        target="_blank"
                        >{{ selectedNode }}</a
                    >
                </div>
                <div>
                    nodes (total): <span>{{ stats.nodes }}</span>
                </div>
                <div>
                    edges (total): <span>{{ stats.edges }}</span>
                </div>
                <div>
                    nodes (on graph): <span>{{ stats.nodesOnGraph }}</span>
                </div>
                <div>
                    status: <span :class="wsStatus">{{ wsStatus }}</span>
                </div>
            </div>
            <LogConsole :logs="logs" />
        </div>

        <div class="graph-panel" v-if="activeProject">
            <FilterPanel
                ref="filterPanelRef"
                v-model="filterQuery"
                @apply="applyFilter"
                @reset="resetFilter"
            />
            <GraphControls
                :physicsEnabled="physicsEnabled"
                @zoom-in="zoomIn"
                @zoom-out="zoomOut"
                @fit="fitGraph"
                @toggle-physics="togglePhysics"
                @reset-view="resetGraphView"
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
                        @click="executeContextMenuAction('copy')"
                        title="copy username"
                    >
                        {{ contextMenu.nodeId }}
                    </div>
                    <div class="context-menu-separator"></div>
                    <div class="context-menu-section">actions</div>
                    <div
                        class="context-menu-item"
                        @click="executeContextMenuAction('expand')"
                    >
                        expand node
                    </div>
                    <div
                        class="context-menu-item"
                        @click="executeContextMenuAction('highlight')"
                    >
                        highlight neighbors
                    </div>
                    <div
                        class="context-menu-item"
                        @click="executeContextMenuAction('open')"
                    >
                        open in Instagram
                    </div>
                    <div class="context-menu-separator"></div>
                    <div class="context-menu-section">pathfinding</div>
                    <div
                        class="context-menu-item"
                        @click="executeContextMenuAction('setAsPathStart')"
                    >
                        set as start
                    </div>
                    <div
                        class="context-menu-item"
                        @click="executeContextMenuAction('setAsPathEnd')"
                    >
                        set as end
                    </div>
                    <div class="context-menu-separator"></div>
                    <div
                        class="context-menu-item"
                        @click="executeContextMenuAction('markAsNotScanned')"
                    >
                        mark as unscanned
                    </div>
                    <div
                        class="context-menu-item danger"
                        @click="executeContextMenuAction('delete')"
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
                            @click="focusOnNode(node)"
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
                            ({{
                                hoverTooltip.isScanned
                                    ? 'scanned'
                                    : 'unscanned'
                            }})
                        </span>
                    </a>
                </div>
            </transition>
        </div>
    </div>

    <ToastNotification ref="toastRef" />
    <KeyboardShortcutsModal ref="keyboardShortcutsModalRef" />
</template>

<script setup lang="ts">
import {
    ref,
    onMounted,
    reactive,
    onUnmounted,
    markRaw,
    computed,
    watch,
    nextTick,
    type Ref,
} from 'vue';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network.js';
import { Client } from '@stomp/stompjs';
import type { Options } from 'vis-network';

import EyeOfRa from '@/components/EyeOfRa.vue';
import Dropdown from '@/components/Dropdown.vue';
import SearchInput from '@/components/SearchInput.vue';
import LogConsole from '@/components/LogConsole.vue';
import TaskDisplay from '@/components/TaskDisplay.vue';
import FilterPanel from '@/components/FilterPanel.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue';
import GraphControls from '@/components/GraphControls.vue';

import { useLog } from '@/composables/useLog';
import { useToast } from '@/composables/useToast';
import { api, apiV1 } from '@/services/api';
import type {
    NodeDataRaw,
    EdgeDataRaw,
    VisNode,
    VisEdge,
    Task,
    StatusMapItem,
    ContextMenuState,
    HoverTooltipState,
} from '@/types/global.d';

const { logs, addLog } = useLog();
const toast = useToast();

const nodesDataSet = new DataSet<VisNode, 'id'>();
const edgesDataSet = new DataSet<VisEdge, 'id'>();
const allNodesBackup = new DataSet<VisNode, 'id'>();

const expandedNodes = ref<Set<string>>(new Set());
const graphContainer = ref<HTMLElement | null>(null);
const network = ref<Network | null>(null);
const physicsEnabled = ref<boolean>(false);

const projects = ref<string[]>([]);
const activeProject = ref<string | null>(null);
const newProjectName = ref<string>('');
const activeTab = ref<string>('scan');
const isScanning = ref<boolean>(false);
const tasks: Record<string, Task> = reactive({});
const scanType = ref<'followers' | 'following' | 'force' | 'default'>(
    'default'
);

const MAX_CONCURRENT_SCANS: number = 3;
const maxFollowersLimit = ref<number | null>(null);
const maxFollowingLimit = ref<number | null>(null);

const statusMap: Record<string, StatusMapItem> = {
    queued: { text: 'queued', class: 'queued' },
    'scanning...': { text: 'scanning...', class: 'scanning' },
    completed: { text: 'completed', class: 'completed' },
    error: { text: 'error', class: 'failed' },
};

const isLoading = ref<boolean>(true);
const isDraggingNode = ref<boolean>(false);
const startUser = ref<string>('dest451920');
const scanDepth = ref<number>(0);
const stats = reactive({ nodes: 0, edges: 0, nodesOnGraph: 0 });
const wsStatus = ref<string>('connecting');
const searchQuery = ref<string>('');
const pathStart = ref<string>('');
const pathEnd = ref<string>('');
const selectedNode = ref<string | null>(null);
const hideSingleConnections = ref<boolean>(false);
const filterQuery = ref<string>('');

const searchSuggestions = ref<string[]>([]);
const showSuggestions = ref<boolean>(false);
const pathStartSuggestions = ref<string[]>([]);
const showPathStartSuggestions = ref<boolean>(false);
const pathEndSuggestions = ref<string[]>([]);
const showPathEndSuggestions = ref<boolean>(false);
const startUserSuggestions = ref<string[]>([]);
const showStartUserSuggestions = ref<boolean>(false);

const contextMenu: ContextMenuState = reactive({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    connectedNodes: [],
});
const hoverTooltip: HoverTooltipState = reactive({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null,
    isScanned: false,
    label: null,
});

const showScanTypeDropdown = ref<boolean>(false);
const scanTypeDropdownX = ref<number>(0);
const scanTypeDropdownY = ref<number>(0);

const showProjectDropdown = ref<boolean>(false);
const projectDropdownX = ref<number>(0);
const projectDropdownY = ref<number>(0);

const projectSelectRef = ref<HTMLElement | null>(null);
const scanButtonRef = ref<HTMLElement | null>(null);
const startUserInputRef = ref<InstanceType<typeof SearchInput> | null>(null);
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null);
const filterPanelRef = ref<InstanceType<typeof FilterPanel> | null>(null);
const toastRef = ref<InstanceType<typeof ToastNotification> | null>(null);
const keyboardShortcutsModalRef = ref<InstanceType<
    typeof KeyboardShortcutsModal
> | null>(null);

const contextMenuRef = ref<HTMLElement | null>(null);

const handleContextMenuClickOutside = (event: MouseEvent) => {
    if (!contextMenu.visible) return;
    const target = event.target as Node;
    const menuEl = contextMenuRef.value;
    if (menuEl && menuEl.contains(target)) return;
    contextMenu.visible = false;
};

watch(
    () => contextMenu.visible,
    (newVal) => {
        if (newVal) {
            window.addEventListener('mousedown', handleContextMenuClickOutside);
        } else {
            window.removeEventListener(
                'mousedown',
                handleContextMenuClickOutside
            );
        }
    },
    { immediate: true }
);

const isScanningLimitReached = computed<boolean>(
    () => Object.keys(tasks || {}).length >= MAX_CONCURRENT_SCANS
);

const runningTasksCount = computed<number>(
    () => Object.keys(tasks || {}).length
);

const scanButtonLabel = computed<string>(() => {
    if (isScanningLimitReached.value) return 'tasks limit';
    const map: Record<string, string> = {
        followers: 'followers',
        following: 'following',
        force: 'force',
        default: '',
    };
    const typeLabel = map[scanType.value] ?? String(scanType.value);
    const count = runningTasksCount.value;
    return `scan ${typeLabel}${count > 0 ? ' (' + count + ')' : ''}`;
});

const startupError = ref<string | null>(null);

const HOVER_DELAY: number = 500;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const randomTagLines: string[] = [
    'unraveling the digital web',
    'seeing through the web',
    'who, with whom, when',
    'analyzing the network of connections',
    'visualizing the invisible',
];
const tagline = computed<string>(
    () => randomTagLines[Math.floor(Math.random() * randomTagLines.length)]
);

const resetAnalysisState = () => {
    searchQuery.value = '';
    pathStart.value = '';
    pathEnd.value = '';
    if (network.value) {
        network.value.unselectAll();
    }
    resetHighlight();
};

watch(activeProject, (newProject, oldProject) => {
    if (newProject && newProject !== oldProject) {
        addLog(`> switching to project: "${newProject}"`);
        selectedNode.value = null;
        resetAnalysisState();
        filterQuery.value = '';
        initGraph();
        fetchLimits();
    }
});

watch(activeTab, (newTab) => {
    nextTick(() => {
        if (newTab === 'scan') {
            startUserInputRef.value?.focus();
        } else if (newTab === 'analyze') {
            searchInputRef.value?.focus();
        }
    });
});

async function fetchProjects(): Promise<void> {
    try {
        addLog('> requesting project list...');
        const response = await apiV1.get<string[]>('/projects');
        projects.value = response.data;
        if (projects.value.length > 0) {
            if (!activeProject.value) {
                activeProject.value = projects.value[0];
            }
            addLog(
                `> projects loaded. active project: "${activeProject.value}"`
            );
        } else {
            addLog('> no projects yet. create the first one');
        }
    } catch (error: any) {
        addLog(
            `<span class="log-error">failed to load projects: ${error.message}</span>`
        );
    }
}

async function createProject(): Promise<void> {
    if (!newProjectName.value) {
        addLog('> project name cannot be empty');
        toast.warning('Enter project name');
        return;
    }
    if (projects.value.includes(newProjectName.value)) {
        addLog('> project already exists');
        toast.warning('Project with this name already exists');
        return;
    }
    try {
        await apiV1.post(`/projects?name=${newProjectName.value}`);
        projects.value.push(newProjectName.value);
        activeProject.value = newProjectName.value;
        addLog(`> project created and selected: "${activeProject.value}"`);
        toast.success(`Project "${newProjectName.value}" created`);
        newProjectName.value = '';
    } catch (error: any) {
        addLog(
            `<span class="log-error">error creating project: ${error.message}</span>`
        );
        toast.error(`Error creating project: ${error.message}`);
    }
}

async function deleteProject(): Promise<void> {
    if (!activeProject.value) {
        addLog('> select project to delete');
        return;
    }
    if (
        !confirm(
            `are you sure you want to delete project "${activeProject.value}" and all its data?`
        )
    ) {
        return;
    }

    try {
        const projectToDelete = activeProject.value;
        await apiV1.delete(`/projects/${projectToDelete}`);
        projects.value = projects.value.filter((p) => p !== projectToDelete);
        if (projects.value.length > 0) {
            activeProject.value = projects.value[0];
        } else {
            activeProject.value = null;
        }
        addLog(`> project "${projectToDelete}" successfully deleted`);
        toast.success(`Project "${projectToDelete}" deleted`);
    } catch (error: any) {
        addLog(
            `<span class="log-error">error deleting project: ${error.message}</span>`
        );
        toast.error(`Error deleting project: ${error.message}`);
    } finally {
        showProjectDropdown.value = false;
    }
}

async function fetchLimits(): Promise<void> {
    try {
        const { data } = await apiV1.get<{
            maxFollowers: number | null;
            maxFollowing: number | null;
        }>('/settings/limits');
        const { maxFollowers, maxFollowing } = data;

        maxFollowersLimit.value = maxFollowers ?? null;
        maxFollowingLimit.value = maxFollowing ?? null;
    } catch (error: any) {
        addLog(
            `<span class="log-error">failed to load limits: ${error.message}</span>`
        );
    }
}

async function setLimit(type: string, value: number) {
    if (value === null || value < 0) {
        addLog(`> limit ${type} cannot be negative`);
        return;
    }
    try {
        await apiV1.post(`/settings/limits/${type}?value=${value}`);
        addLog(`> set limit ${type}: ${value}`);
    } catch (error: any) {
        addLog(
            `<span class="log-error">error setting limit ${type}: ${error.message}</span>`
        );
    }
}

function hideContextMenu(): void {
    contextMenu.visible = false;
}

function formatNode(n: NodeDataRaw): VisNode {
    return {
        id: n.username,
        label: n.nickname || n.username,
        color: n.scanned ? '#7BE141' : '#F0A30A',
        scanned: n.scanned,
    };
}

function formatEdge(e: EdgeDataRaw): VisEdge {
    return {
        id: `${e.source}-${e.target}`,
        from: e.source,
        to: e.target,
        arrows: 'to',
        color: { color: e.active ? '#FFFFFF' : '#444444' },
        dashes: !e.active,
    };
}

function updateFilteredNodes(): void {
    if (!network.value) return;

    if (!hideSingleConnections.value) {
        const nodesToAdd = allNodesBackup.get({
            filter: (node) => !nodesDataSet.get(node.id),
        });
        if (nodesToAdd.length > 0) {
            nodesDataSet.add(nodesToAdd);
        }
    } else {
        const edgeCounts = new Map<string, number>();
        edgesDataSet.forEach((edge: VisEdge) => {
            edgeCounts.set(edge.from, (edgeCounts.get(edge.from) || 0) + 1);
            edgeCounts.set(edge.to, (edgeCounts.get(edge.to) || 0) + 1);
        });

        const nodesToRemove = nodesDataSet.get({
            filter: (node: VisNode) => (edgeCounts.get(node.id) || 0) < 2,
        });

        if (nodesToRemove.length > 0) {
            nodesDataSet.remove(nodesToRemove.map((n) => n.id));
        }
    }
    stats.nodesOnGraph = nodesDataSet.length;
}

watch(hideSingleConnections, updateFilteredNodes);

nodesDataSet.on('*', () => {
    stats.nodes = allNodesBackup.length;
    updateFilteredNodes();
});
edgesDataSet.on('*', () => {
    stats.edges = edgesDataSet.length;
    updateFilteredNodes();
});

const stompClient = new Client({
    brokerURL: 'ws://localhost:8080/ws-mycelium',
    onConnect: () => {
        wsStatus.value = 'connected';
        addLog('> WS: connection established');
        stompClient.subscribe('/topic/logs', (message) => {
            const update = JSON.parse(message.body);
            addLog(`> [${update.taskId.slice(0, 8)}] ${update.message}`);
        });
        stompClient.subscribe('/topic/updates', (message) => {
            const update = JSON.parse(message.body);
            if (update.type === 'USER_NODE_UPDATE') {
                const nodeData = formatNode({
                    username: update.username,
                    nickname: update.nickname,
                    scanned: update.isScanned,
                });
                nodesDataSet.update(nodeData);
                allNodesBackup.update(nodeData);
            } else if (update.type === 'NEW_EDGE') {
                if (!nodesDataSet.get(update.source)) {
                    const nodeData = formatNode({
                        username: update.source,
                        scanned: false,
                    });
                    nodesDataSet.add(nodeData);
                    allNodesBackup.add(nodeData);
                }
                if (!nodesDataSet.get(update.target)) {
                    const nodeData = formatNode({
                        username: update.target,
                        scanned: false,
                    });
                    nodesDataSet.add(nodeData);
                    allNodesBackup.add(nodeData);
                }
                const edgeId = `${update.source}-${update.target}`;
                if (!edgesDataSet.get(edgeId)) {
                    edgesDataSet.add(
                        formatEdge({
                            source: update.source,
                            target: update.target,
                            active: true,
                        })
                    );
                }
            } else if (update.type === 'NODE_DELETION') {
                nodesDataSet.remove(update.username);
                allNodesBackup.remove(update.username);
                const connectedEdges = network.value
                    ? network.value.getConnectedEdges(update.username)
                    : [];
                if (connectedEdges.length > 0)
                    edgesDataSet.remove(connectedEdges);
            }
        });
        stompClient.subscribe('/topic/status', (message) => {
            const update = JSON.parse(message.body);
            const task = tasks[update.taskId];
            if (!task) return;

            const status = update.type;
            if (status === 'SCAN_STARTED') {
                task.status = 'scanning...';
            } else if (status === 'SCAN_COMPLETED') {
                task.status = 'completed';
                setTimeout(() => {
                    delete tasks[update.taskId];
                }, 5000);
            } else if (status === 'SCAN_FAILED') {
                task.status = 'error';
                setTimeout(() => {
                    delete tasks[update.taskId];
                }, 10000);
            }
        });
    },
    onStompError: (error) => {
        wsStatus.value = 'error';
        addLog(
            `<span class="log-error">WS error: ${error.headers.message}</span>`
        );
    },
    onWebSocketError: (error) => {
        wsStatus.value = 'error';
    },
});

async function initiateScan(
    type: 'followers' | 'following' | 'force' | 'default'
): Promise<void> {
    if (!activeProject.value || !startUser.value) {
        addLog('<span class="log-error">select project and enter user</span>');
        toast.warning('Select project and enter username');
        return;
    }

    addLog(
        `> [Project: ${activeProject.value}] Sending scan task for ${startUser.value} (type: ${type})...`
    );
    try {
        const response = await apiV1.post<{ taskId: string }>(
            `/scan/start?username=${startUser.value}&depth=${scanDepth.value}&projectName=${activeProject.value}&type=${type}`
        );

        const { taskId } = response.data;

        tasks[taskId] = {
            startUser: startUser.value,
            status: 'queued',
        };

        addLog(`> task created with id: ${taskId}`);
        toast.success(`Scan for ${startUser.value} started`);
    } catch (err: any) {
        addLog(`> error creating task: ${err.message}`);
        toast.error(`Error creating task: ${err.message}`);
    }
}

function handleScanButtonMousedown(event: MouseEvent): void {
    if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        showScanTypeDropdown.value = true;
        const buttonRect = (
            event.currentTarget as HTMLElement
        ).getBoundingClientRect();
        scanTypeDropdownX.value = buttonRect.left;
        scanTypeDropdownY.value = buttonRect.bottom + 5;
    } else {
        showScanTypeDropdown.value = false;
        initiateScan(scanType.value);
    }
}

function selectScanTypeFromDropdown(type: string): void {
    showScanTypeDropdown.value = false;
    initiateScan(type as 'followers' | 'following' | 'force' | 'default');
}

function handleProjectSelectMousedown(event: MouseEvent): void {
    if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        showProjectDropdown.value = true;
        const selectRect = (
            event.currentTarget as HTMLElement
        ).getBoundingClientRect();
        projectDropdownX.value = selectRect.left;
        projectDropdownY.value = selectRect.bottom + 5;
    } else {
        showProjectDropdown.value = false;
    }
}

function handleProjectDropdownSelect(action: string): void {
    if (action === 'delete') {
        deleteProject();
    }
    showProjectDropdown.value = false;
}

async function initGraph(): Promise<void> {
    if (!activeProject.value) {
        nodesDataSet.clear();
        edgesDataSet.clear();
        expandedNodes.value.clear();
        if (network.value) {
            network.value.setData({ nodes: nodesDataSet, edges: edgesDataSet });
        }
        addLog('> select project to load graph');
        return;
    }
    isLoading.value = true;
    addLog(`> loading graph for project: "${activeProject.value}"`);
    nodesDataSet.clear();
    edgesDataSet.clear();
    allNodesBackup.clear();
    expandedNodes.value.clear();

    try {
        const response = await apiV1.get<{
            nodes: NodeDataRaw[];
            edges: EdgeDataRaw[];
        }>(`/graph/initial?projectName=${activeProject.value}`);
        const rawData = response.data;

        const initialNodes = rawData.nodes.map(formatNode);
        nodesDataSet.add(initialNodes);
        allNodesBackup.add(initialNodes);

        edgesDataSet.add(rawData.edges.map(formatEdge));

        stats.nodes = allNodesBackup.length;
        stats.edges = edgesDataSet.length;

        const options: Options = {
            nodes: {
                shape: 'dot',
                size: 12,
                font: {
                    color: '#fff',
                    size: 10,
                    face: 'Consolas',
                    strokeWidth: 2,
                    strokeColor: '#242424',
                },
                borderWidth: 2,
            },
            edges: {
                width: 1,
                color: { color: '#FFFFFF', opacity: 1 },
            },
            physics: {
                enabled: false,
                barnesHut: {
                    gravitationalConstant: -10000,
                    centralGravity: 0.01,
                    springLength: 50,
                    springConstant: 0.008,
                    damping: 0.1,
                    avoidOverlap: 1,
                },
                stabilization: {
                    enabled: true,
                    iterations: 1000,
                    updateInterval: 25,
                },
                solver: 'barnesHut',
            },
            interaction: { hover: true },
        };

        physicsEnabled.value = options.physics?.enabled ?? false;

        if (network.value) {
            network.value.setData({ nodes: nodesDataSet, edges: edgesDataSet });
            network.value.setOptions(options);
            network.value.fit();
        } else if (graphContainer.value) {
            network.value = markRaw(
                new Network(
                    graphContainer.value,
                    { nodes: nodesDataSet, edges: edgesDataSet },
                    options
                )
            );
            setupNetworkEvents();
        }
        updateFilteredNodes();
        addLog(`> initial graph for "${activeProject.value}" loaded`);
    } catch (error: any) {
        addLog(
            `<span class="log-error">error loading graph: ${error.message}</span>`
        );
    } finally {
        isLoading.value = false;
    }
}

function setupNetworkEvents(): void {
    if (!network.value) return;

    network.value.once('afterDrawing', () => {
        addLog('> initial drawing completed, enabling physics...');

        if (network.value) {
            network.value.setOptions({ physics: { enabled: true } });
            physicsEnabled.value = true;
        }
    });

    network.value.on(
        'selectNode',
        (params: { nodes: string[]; event: { srcEvent: MouseEvent } }) => {
            const nodeId = params.nodes[0];
            selectedNode.value = nodeId;

            if (nodeId) {
                startUser.value = nodeId;
            }

            if (params.event.srcEvent.shiftKey) {
                pathEnd.value = nodeId;
            } else {
                pathStart.value = nodeId;
                pathEnd.value = nodeId;
            }
        }
    );

    network.value.on(
        'hoverNode',
        (params: {
            node: string;
            pointer: { DOM: { x: number; y: number } };
        }) => {
            if (isDraggingNode.value) return;
            const nodeId = params.node;
            if (nodeId) {
                if (hoverTimer) clearTimeout(hoverTimer);
                const nodeData = nodesDataSet.get(nodeId);
                if (nodeData) {
                    hoverTimer = setTimeout(() => {
                        hoverTooltip.nodeId = nodeData.id;
                        hoverTooltip.label = nodeData.label;
                        hoverTooltip.isScanned = nodeData.scanned;
                        hoverTooltip.x = params.pointer.DOM.x;
                        hoverTooltip.y = params.pointer.DOM.y;
                        hoverTooltip.visible = true;
                    }, HOVER_DELAY);
                }
            }
        }
    );
    network.value.on('blurNode', () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        hoverTooltip.visible = false;
        hoverTooltip.nodeId = null;
        hoverTooltip.label = null;
    });
    network.value.on('dragStart', (params: { nodes: string[] }) => {
        if (params.nodes.length > 0) {
            isDraggingNode.value = true;
            if (hoverTimer) clearTimeout(hoverTimer);
            hoverTooltip.visible = false;
        }
    });
    network.value.on('dragEnd', () => {
        isDraggingNode.value = false;
    });
    network.value.on('deselectNode', () => {
        selectedNode.value = null;
    });
    network.value.on('doubleClick', async (params: { nodes: string[] }) => {
        if (params.nodes.length > 0) {
            await expandNode(params.nodes[0]);
        }
    });
    network.value.on(
        'oncontext',
        (params: {
            event: MouseEvent;
            nodes: string[];
            pointer: { DOM: { x: number; y: number } };
        }) => {
            params.event.preventDefault();
            if (hoverTimer) clearTimeout(hoverTimer);
            hoverTooltip.visible = false;
            const nodeId = params.nodes[0];
            if (nodeId) {
                const connectedIdsRaw =
                    network.value?.getConnectedNodes(nodeId) || [];
                const connectedIds = Array.isArray(connectedIdsRaw)
                    ? connectedIdsRaw.filter((id) => typeof id === 'string')
                    : typeof connectedIdsRaw === 'string'
                    ? [connectedIdsRaw]
                    : [];
                const connectedNodeObjects = nodesDataSet.get(connectedIds);
                contextMenu.nodeId = nodeId;
                contextMenu.connectedNodes = connectedNodeObjects.map(
                    (n: VisNode) => n.label
                );
                contextMenu.x = params.pointer.DOM.x;
                contextMenu.y = params.pointer.DOM.y;
                contextMenu.visible = true;
            } else {
                hideContextMenu();
            }
        }
    );
}

async function expandNode(username: string): Promise<void> {
    if (!activeProject.value) return;
    if (expandedNodes.value.has(username)) {
        addLog(`> node ${username} has already been expanded`);
        network.value?.focus(username);
        return;
    }
    addLog(`> expanding node ${username}...`);
    try {
        const response = await apiV1.get<{
            nodes: NodeDataRaw[];
            edges: EdgeDataRaw[];
        }>(
            `/graph/expand?username=${username}&projectName=${activeProject.value}`
        );
        const { nodes: nodesToAddRaw, edges: edgesToAddRaw } = response.data;
        const nodesToAdd = nodesToAddRaw
            .filter((n: NodeDataRaw) => !nodesDataSet.get(n.username))
            .map(formatNode);
        const edgesToAdd = edgesToAddRaw
            .filter(
                (e: EdgeDataRaw) => !edgesDataSet.get(`${e.source}-${e.target}`)
            )
            .map(formatEdge);
        if (nodesToAdd.length > 0) nodesDataSet.add(nodesToAdd);
        if (edgesToAdd.length > 0) edgesDataSet.add(edgesToAdd);
        expandedNodes.value.add(username);
        addLog(
            `> node ${username} expanded. Added: ${nodesToAdd.length} nodes, ${edgesToAdd.length} edges.`
        );
    } catch (err: any) {
        addLog(
            `<span class="log-error">error expanding node: ${err.message}</span>`
        );
    }
}

async function deleteNode(username: string): Promise<void> {
    if (
        !confirm(
            `are you sure you want to permanently delete node "${username}" and all its connections?`
        )
    ) {
        return;
    }
    addLog(`> deleting node ${username}...`);
    try {
        await apiV1.delete(`/graph/${username}`);
        addLog(`> node ${username} successfully deleted`);
    } catch (err: any) {
        addLog(
            `<span class="log-error">error deleting node: ${err.message}</span>`
        );
    }
}

function getFullNodeList(): VisNode[] {
    return nodesDataSet.get({ returnType: 'Array' });
}

function updateSuggestions(
    query: string | number,
    suggestionsRef: Ref<string[]>
): void {
    const queryString = String(query);
    if (queryString.length > 0) {
        suggestionsRef.value = getFullNodeList()
            .map((n: VisNode) => n.id)
            .filter((id: string) =>
                id.toLowerCase().includes(queryString.toLowerCase())
            )
            .sort((a, b) => a.localeCompare(b));
    } else {
        suggestionsRef.value = [];
    }
}

const updateSearchSuggestions = (value: string | number) =>
    updateSuggestions(value, searchSuggestions);
const selectSearchSuggestion = (suggestion: string) => {
    searchQuery.value = suggestion;
    showSuggestions.value = false;
    searchNode();
};

const updatePathStartSuggestions = (value: string | number) =>
    updateSuggestions(value, pathStartSuggestions);
const selectPathStartSuggestion = (suggestion: string) => {
    pathStart.value = suggestion;
    showPathStartSuggestions.value = false;
};

const updatePathEndSuggestions = (value: string | number) =>
    updateSuggestions(value, pathEndSuggestions);
const selectPathEndSuggestion = (suggestion: string) => {
    pathEnd.value = suggestion;
    showPathEndSuggestions.value = false;
};

const updateStartUserSuggestions = (value: string | number) =>
    updateSuggestions(value, startUserSuggestions);
const selectStartUserSuggestion = (suggestion: string) => {
    startUser.value = suggestion;
    showStartUserSuggestions.value = false;
};

function searchNode(): void {
    if (searchQuery.value && network.value) {
        const nodeId = searchQuery.value;
        const nodeData = nodesDataSet.get(nodeId);
        if (nodeData) {
            network.value.focus(nodeId, {
                scale: 1.5,
                animation: { duration: 1000, easingFunction: 'easeInOutQuad' },
            });
            network.value.selectNodes([nodeId]);
            selectedNode.value = nodeId;

            const originalColor =
                typeof nodeData.color === 'object'
                    ? JSON.parse(JSON.stringify(nodeData.color))
                    : nodeData.color;
            const pingNode = {
                id: nodeId,
                size: 25,
                color: { border: '#FF5555', background: '#FF5555' },
                shadow: { enabled: true, color: '#FF5555', size: 30 },
            };
            const normalNode = {
                id: nodeId,
                size: 12,
                color: originalColor,
                shadow: false,
            };
            nodesDataSet.update(pingNode);
            setTimeout(() => nodesDataSet.update(normalNode), 1500);
            toast.success(`Node "${nodeId}" found`);
        } else {
            addLog(`> node "${searchQuery.value}" not found`);
            toast.warning(`Node "${searchQuery.value}" not found`);
        }
    }
}

const resetSearch = () => {
    searchQuery.value = '';
    network.value?.unselectAll();
    resetHighlight();
};

const resetPath = () => {
    pathStart.value = '';
    pathEnd.value = '';
    resetHighlight();
};

async function findPath(): Promise<void> {
    if (!activeProject.value) return;
    if (!pathStart.value || !pathEnd.value) {
        addLog(`> start and end nodes not specified`);
        return;
    }
    addLog(`> searching for path from ${pathStart.value} to ${pathEnd.value}`);
    try {
        const response = await apiV1.get<string[]>(
            `/graph/shortest-path?start=${pathStart.value}&end=${pathEnd.value}&projectName=${activeProject.value}`
        );
        const pathUsernames = response.data;
        if (pathUsernames.length > 0) {
            highlightPath(pathUsernames);
            addLog(
                `> path found: <span class="log-success">${pathUsernames.join(
                    ' → '
                )}</span>`
            );
        } else {
            addLog('> path not found');
        }
    } catch (err: any) {
        addLog(`> error searching for path: ${err.message}`);
    }
}

function highlightPath(path: string[]): void {
    resetHighlight();
    const pathEdgesIds: string[] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const edgeId1 = `${path[i]}-${path[i + 1]}`;
        if (edgesDataSet.get(edgeId1)) pathEdgesIds.push(edgeId1);
        else {
            const edgeId2 = `${path[i + 1]}-${path[i]}`;
            if (edgesDataSet.get(edgeId2)) pathEdgesIds.push(edgeId2);
        }
    }
    nodesDataSet.update(
        nodesDataSet.map((n: VisNode) => ({
            id: n.id,
            color: path.includes(n.id) ? '#FF5555' : '#444',
        }))
    );
    edgesDataSet.update(
        edgesDataSet.map((e: VisEdge) => ({
            id: e.id,
            color: { color: pathEdgesIds.includes(e.id) ? '#FF5555' : '#222' },
        }))
    );
}

function highlightNeighbors(): void {
    if (!selectedNode.value || !network.value) return;
    resetHighlight();
    let neighborNodesIdsRaw = network.value.getConnectedNodes(
        selectedNode.value
    );

    const neighborNodesIds: string[] = Array.isArray(neighborNodesIdsRaw)
        ? neighborNodesIdsRaw
              .filter((id) => typeof id === 'string')
              .map((id) => id as string)
        : typeof neighborNodesIdsRaw === 'string'
        ? [neighborNodesIdsRaw]
        : [];
    const updates = nodesDataSet.map((n: VisNode) => ({
        id: n.id,
        color:
            n.id === selectedNode.value
                ? '#FF5555'
                : neighborNodesIds.includes(n.id)
                ? '#F0A30A'
                : '#444',
    }));
    nodesDataSet.update(updates);
    const connectedEdgesIds = network.value.getConnectedEdges(
        selectedNode.value
    );
    edgesDataSet.update(
        edgesDataSet.map((e: VisEdge) => ({
            id: e.id,
            color: {
                color: connectedEdgesIds.includes(e.id) ? '#FFFFFF' : '#222',
            },
        }))
    );
}

function resetHighlight(): void {
    const originalNodes = nodesDataSet.map((n: VisNode) => ({
        id: n.id,
        color: n.scanned ? '#7BE141' : '#F0A30A',
    }));
    nodesDataSet.update(originalNodes);
    const originalEdges = edgesDataSet.map((e: VisEdge) => ({
        id: e.id,
        color: { color: e.dashes ? '#444444' : '#FFFFFF' },
    }));
    edgesDataSet.update(originalEdges);
}

async function expandAllNodes(): Promise<void> {
    if (!activeProject.value) return;
    isLoading.value = true;
    addLog('> requesting full graph from database...');
    try {
        const response = await apiV1.get<{
            nodes: NodeDataRaw[];
            edges: EdgeDataRaw[];
        }>(`/graph/all?projectName=${activeProject.value}`);
        const { nodes: allNodesRaw, edges: allEdgesRaw } = response.data;
        addLog(
            `> full graph received. nodes: ${allNodesRaw.length}, edges: ${allEdgesRaw.length}`
        );
        nodesDataSet.clear();
        edgesDataSet.clear();
        expandedNodes.value.clear();
        const allNodes = allNodesRaw.map(formatNode);
        const allEdges = allEdgesRaw.map(formatEdge);
        nodesDataSet.add(allNodes);
        edgesDataSet.add(allEdges);
        allNodes.forEach((node) => expandedNodes.value.add(node.id));
        updateFilteredNodes();
        addLog('> graph fully updated');
    } catch (err: any) {
        addLog(
            `<span class="log-error">error loading full graph: ${err.message}</span>`
        );
    } finally {
        isLoading.value = false;
    }
}

function markAsNotScanned(nodeId: string): void {
    if (!nodeId || !nodesDataSet.get(nodeId)) return;
    nodesDataSet.update({
        id: nodeId,
        scanned: false,
        color: '#F0A30A',
    });
    try {
        apiV1.patch(`/user/${nodeId}/scanned?scanned=false`);
        addLog(`> node ${nodeId} marked as unscanned`);
    } catch (err: any) {
        addLog(
            `<span class="log-error">error marking node as unscanned: ${err.message}</span>`
        );
    }
}

function resetFilter(): void {
    filterQuery.value = '';
    resetHighlight();
}

function applyFilter(): void {
    if (!filterQuery.value) {
        addLog('> filter field is empty, resetting highlight');
        resetHighlight();
        return;
    }
    addLog(`> applying filter: "${filterQuery.value}"`);
    const match = filterQuery.value
        .toLowerCase()
        .match(
            /^(in-degree|out-degree|degree|label)\s*([<>=]|contains)\s*(.+)$/
        );
    if (!match) {
        addLog(
            `<span class="log-error">error: invalid filter syntax.</span>`
        );
        return;
    }
    const [, metric, operator, value] = match;
    const numericValue = parseFloat(value);
    const stringValue = value.trim();
    const highlightedNodeIds = new Set<string>();
    const allNodes = nodesDataSet.get();
    const allEdges = edgesDataSet.get();
    const inDegreeMap = new Map<string, number>();
    const outDegreeMap = new Map<string, number>();
    allNodes.forEach((node: VisNode) => {
        inDegreeMap.set(node.id, 0);
        outDegreeMap.set(node.id, 0);
    });
    allEdges.forEach((edge: VisEdge) => {
        outDegreeMap.set(edge.from, (outDegreeMap.get(edge.from) || 0) + 1);
        inDegreeMap.set(edge.to, (inDegreeMap.get(edge.to) || 0) + 1);
    });
    allNodes.forEach((node: VisNode) => {
        let isMatch = false;
        switch (metric) {
            case 'in-degree': {
                const degree = inDegreeMap.get(node.id) || 0;
                if (operator === '>' && degree > numericValue) isMatch = true;
                if (operator === '<' && degree < numericValue) isMatch = true;
                if (operator === '=' && degree === numericValue) isMatch = true;
                break;
            }
            case 'out-degree': {
                const degree = outDegreeMap.get(node.id) || 0;
                if (operator === '>' && degree > numericValue) isMatch = true;
                if (operator === '<' && degree < numericValue) isMatch = true;
                if (operator === '=' && degree === numericValue) isMatch = true;
                break;
            }
            case 'degree': {
                const degree =
                    (inDegreeMap.get(node.id) || 0) +
                    (outDegreeMap.get(node.id) || 0);
                if (operator === '>' && degree > numericValue) isMatch = true;
                if (operator === '<' && degree < numericValue) isMatch = true;
                if (operator === '=' && degree === numericValue) isMatch = true;
                break;
            }
            case 'label':
                if (
                    operator === 'contains' &&
                    node.label.toLowerCase().includes(stringValue)
                ) {
                    isMatch = true;
                }
                if (
                    operator === '=' &&
                    node.label.toLowerCase() === stringValue
                ) {
                    isMatch = true;
                }
                break;
        }
        if (isMatch) {
            highlightedNodeIds.add(node.id);
        }
    });
    if (highlightedNodeIds.size === 0) {
        addLog('> filter applied, no matches found');
    } else {
        addLog(`> filter applied, nodes found: ${highlightedNodeIds.size}`);
    }
    const nodeUpdates = allNodes.map((node: VisNode) => ({
        id: node.id,
        color: highlightedNodeIds.has(node.id) ? '#FF00FF' : '#444',
    }));
    const edgeUpdates = allEdges.map((edge: VisEdge) => ({
        id: edge.id,
        color: { color: '#222' },
    }));
    nodesDataSet.update(nodeUpdates);
    edgesDataSet.update(edgeUpdates);
}

function focusOnNode(nodeId: string): void {
    if (network.value) {
        network.value.focus(nodeId, {
            scale: 1.5,
            animation: { duration: 500, easingFunction: 'easeInOutQuad' },
        });
    }
}

function executeContextMenuAction(action: string): void {
    if (!contextMenu.nodeId) return;
    const nodeId = contextMenu.nodeId;
    switch (action) {
        case 'copy':
            navigator.clipboard.writeText(nodeId).then(() => {
                addLog(`> copied node ID: ${nodeId}`);
            });
            break;
        case 'expand':
            expandNode(nodeId);
            break;
        case 'highlight':
            selectedNode.value = nodeId;
            highlightNeighbors();
            break;
        case 'setAsPathStart':
            pathStart.value = nodeId;
            addLog(`> node ${nodeId} set as start`);
            activeTab.value = 'analyze';
            break;
        case 'setAsPathEnd':
            pathEnd.value = nodeId;
            addLog(`> node ${nodeId} set as end`);
            activeTab.value = 'analyze';
            break;
        case 'markAsNotScanned':
            markAsNotScanned(nodeId);
            break;
        case 'delete':
            deleteNode(nodeId);
            break;
        case 'open':
            window.open(`https://www.instagram.com/${nodeId}`, '_blank');
            break;
    }
    hideContextMenu();
}

const zoomIn = () => {
    if (network.value) {
        const scale = network.value.getScale();
        network.value.moveTo({ scale: scale * 1.2 });
    }
};

const zoomOut = () => {
    if (network.value) {
        const scale = network.value.getScale();
        network.value.moveTo({ scale: scale * 0.8 });
    }
};

const fitGraph = () => {
    if (network.value) {
        network.value.fit({
            animation: { duration: 500, easingFunction: 'easeInOutQuad' },
        });
    }
};

const togglePhysics = () => {
    if (network.value) {
        const currentState = physicsEnabled.value;
        network.value.setOptions({ physics: { enabled: !currentState } });
        physicsEnabled.value = !currentState;
        toast.info(`graph physics ${!currentState ? 'enabled' : 'disabled'}`);
    }
};

const resetGraphView = () => {
    if (network.value) {
        network.value.fit();
        network.value.unselectAll();
        resetHighlight();
        toast.info('graph view reset');
    }
};

const handleKeydown = (event: KeyboardEvent) => {
    if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
    ) {
        if (event.key === 'Escape') {
            (event.target as HTMLElement).blur();
        }
        return;
    }

    if (event.altKey) {
        event.preventDefault();
        if (event.key === '1') activeTab.value = 'scan';
        if (event.key === '2') activeTab.value = 'analyze';
        if (event.key === '3') activeTab.value = 'settings';
    }

    if (event.key === '/') {
        event.preventDefault();
        if (activeTab.value === 'analyze') {
            searchInputRef.value?.focus();
        } else {
            filterPanelRef.value?.focus();
        }
    }

    if (event.key === '?') {
        event.preventDefault();
        keyboardShortcutsModalRef.value?.open();
    }

    if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        fitGraph();
    }

    if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        resetGraphView();
    }

    if (event.key.toLowerCase() === ' ') {
        event.preventDefault();
        togglePhysics();
    }

    if (event.key === 'Escape') {
        if (contextMenu.visible) {
            hideContextMenu();
        } else if (selectedNode.value) {
            resetAnalysisState();
        }
    }

    if (event.ctrlKey || event.metaKey) {
        if (event.key === '=' || event.key === '+') {
            event.preventDefault();
            zoomIn();
        } else if (event.key === '-') {
            event.preventDefault();
            zoomOut();
        }
    }
};

onMounted(async () => {
    addLog('> system is starting...');

    if (toastRef.value) {
        toast.setToastRef(toastRef.value);
    }

    try {
        addLog('> checking connection to backend...');
        await api.get('/actuator/health');
        addLog('> connection to backend established');
        toast.success('Connection to server established');

        stompClient.activate();
        await fetchProjects();

        window.addEventListener('keydown', handleKeydown);

        if (!activeProject.value) {
            isLoading.value = false;
            addLog('> to start, create your first project');
        } else {
            fetchLimits();
        }
    } catch (error: any) {
        const errorMessage = `failed to connect to backend. is it running? (${error.message})`;
        addLog(`<span class="log-error">${errorMessage}</span>`);
        startupError.value = errorMessage;
        toast.error('Failed to connect to server');
    }
});

onUnmounted(() => {
    if (stompClient.active) stompClient.deactivate();
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('mousedown', handleContextMenuClickOutside);
});
</script>

<style>
:root {
    --transition-speed: 0.2s;
    --primary-color: #7be141;
    --secondary-color: #f0a30a;
    --danger-color: #ff5555;
    --info-color: #3498db;
    --bg-dark: #1a1a1a;
    --bg-panel: #242424;
    --bg-input: #333;
    --border-color: #444;
    --border-hover: #555;
}

body,
html {
    margin: 0;
    padding: 0;
    background-color: var(--bg-dark);
    color: #e0e0e0;
    font-family: 'Consolas', 'Menlo', monospace;
    overflow: hidden;
}

* {
    box-sizing: border-box;
}

#app {
    display: flex;
    height: 100vh;
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin-bottom: 10px;
    animation: slideDown 0.5s ease-out;
}

@keyframes slideDown {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.logo-container h2 {
    margin: 0;
    margin-bottom: 5px;
    color: var(--primary-color);
    text-shadow: 0 0 10px rgba(123, 225, 65, 0.3);
}
.logo-container span {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    font-size: 12px;
    opacity: 0.8;
}
.logo {
    width: 4rem;
    fill: white;
    color: white;
    margin-bottom: 5px;
    transition: all 0.3s ease;
}

.logo:hover {
    transform: scale(1.05);
    filter: drop-shadow(0 0 8px rgba(123, 225, 65, 0.5));
}

.logo-error {
    animation: pulse-error 1s infinite;
}
.main-panel {
    width: 350px;
    height: 100%;
    background-color: var(--bg-panel);
    border-right: 1px solid var(--border-color);
    padding: 20px;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow-y: auto;
    transition: transform 0.3s ease;
}
.main-panel::-webkit-scrollbar {
    width: 8px;
}
.main-panel::-webkit-scrollbar-track {
    background: var(--bg-dark);
    border-radius: 4px;
}
.main-panel::-webkit-scrollbar-thumb {
    background: var(--border-hover);
    border-radius: 4px;
    transition: background 0.2s ease;
}
.main-panel::-webkit-scrollbar-thumb:hover {
    background: var(--primary-color);
}
.main-panel {
    scrollbar-width: thin;
    scrollbar-color: var(--border-hover) var(--bg-dark);
}
.graph-panel {
    flex-grow: 1;
    height: 100%;
    position: relative;
    background-color: var(--bg-dark);
}
.graph-panel .watermark {
    position: absolute;
    text-align: right;
    bottom: 0;
    right: 0;
    margin-right: 3rem;
    margin-bottom: 2rem;
    opacity: 0.015;
    pointer-events: none;
    transition: opacity 0.3s ease;
}
.graph-panel .watermark img {
    width: 20rem;
    filter: invert(1);
}
.graph-container {
    width: 100%;
    height: 100%;
}

.graph-container,
.graph-container .vis-network,
.graph-container canvas,
.vis-network,
.vis-network canvas {
    background-color: transparent !important;
    border: none !important;
    outline: none !important;
    display: block;
}

.graph-container canvas:focus {
    outline: none !important;
}

input,
button,
select {
    width: 100%;
    padding: 8px;
    background-color: var(--bg-input);
    border: 1px solid var(--border-hover);
    color: #e0e0e0;
    border-radius: 4px;
    box-sizing: border-box;
    transition: all var(--transition-speed) ease;
}

input:focus,
select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 8px rgba(123, 225, 65, 0.3);
    outline: none;
}

input:hover,
select:hover {
    border-color: var(--primary-color);
}

button {
    cursor: pointer;
    background-color: #7be141;
    color: #1a1a1a;
    font-weight: bold;
}
button:hover {
    filter: brightness(1.1);
}

button:disabled {
    background-color: var(--border-hover);
    color: #aaa;
    cursor: not-allowed;
    filter: none;
}

button:disabled::before {
    display: none;
}

.button-active-feedback:active {
    transform: scale(0.98);
}
.link-button {
    background: none;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    text-decoration: underline;
    font-size: 11px;
    padding: 0;
    font-weight: normal;
    transition: all var(--transition-speed) ease;
}

.link-button:hover {
    color: #a0f171;
    text-shadow: 0 0 5px rgba(123, 225, 65, 0.5);
}

.link-button::before {
    display: none;
}

.filter-control {
    display: flex;
    align-items: center;
    padding: 0;
}
.filter-control label {
    margin-left: 10px;
    cursor: pointer;
    transition: color var(--transition-speed) ease;
}

.filter-control label:hover {
    color: var(--primary-color);
}

.filter-control input {
    width: auto;
    margin-bottom: 0;
}
.scan-max-control {
    margin-top: 1rem;
}

.scan-max-control input {
    margin-top: 0.3rem;
    margin-bottom: 0.5rem;
}

.scan-max-control label {
    color: #aaa;
}
.stats {
    border-top: 1px solid var(--border-color);
    margin-top: auto;
    padding-top: 10px;
    animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
    from {
        transform: translateY(20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.stats div {
    transition: all var(--transition-speed) ease;
    padding: 2px 0;
}

.stats div:hover {
    color: var(--primary-color);
}

.stats div span {
    color: var(--primary-color);
    float: right;
    font-weight: bold;
}
.tabs {
    display: flex;
    margin: 20px 0;
    gap: 5px;
}
.tabs button {
    flex-grow: 1;
    background: var(--bg-input);
    border: 1px solid var(--border-hover);
    color: #aaa;
    padding: 10px;
    cursor: pointer;
    border-radius: 4px;
    position: relative;
    transition: all var(--transition-speed) ease;
}

.tabs button::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: var(--primary-color);
    transform: translateX(-50%);
    transition: width 0.3s ease;
}

.tabs button.active::after {
    width: 80%;
}

.tabs button.active {
    background: var(--border-hover);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.tabs button:hover:not(.active) {
    background: #3a3a3a;
    color: #ddd;
}

.panel-content {
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.3s ease-out;
}
.controls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    color: #aaa;
    text-transform: uppercase;
    font-size: 11px;
}
hr {
    border: 0;
    border-top: 1px solid var(--border-color);
    width: 100%;
    margin: 15px 0;
    opacity: 0.5;
}
.selected-info {
    font-size: 14px;
    text-align: center;
    padding: 8px;
    margin-bottom: 8px;
    background-color: rgba(240, 163, 10, 0.1);
    border: 1px solid var(--secondary-color);
    border-radius: 4px;
    color: var(--secondary-color);
    animation: slideDown 0.3s ease-out;
}
.selected-info a {
    color: var(--secondary-color);
    font-weight: bold;
    text-decoration: none;
    transition: all var(--transition-speed) ease;
}
.selected-info a:hover {
    text-decoration: underline;
    text-shadow: 0 0 5px rgba(240, 163, 10, 0.5);
}

.log-success {
    color: #7be141;
}
.log-error {
    color: #ff5555;
}
.preloader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #1a1a1a;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: opacity 0.5s ease;
}
.preloader-logo {
    width: 8rem;
    fill: #ffffff;
    transform: scale(2);
    animation: pulse 1s infinite cubic-bezier(0.165, 0.84, 0.44, 1);
    transition: fill 1s;
}
.preloader-logo-error {
    animation: pulse-error 1s infinite cubic-bezier(0.165, 0.84, 0.44, 1);
    fill: #ff5555;
}
.preloader p {
    margin-top: 60px;
    color: #e0e0e0;
    font-size: 1.2rem;
    letter-spacing: 2px;
    text-transform: uppercase;
}
.preloader-error {
    text-align: center;
    padding: 20px;
    max-width: 600px;
    margin-top: 1rem;
}
.preloader-error h2 {
    color: #ff5555;
    text-transform: uppercase;
}
.preloader-error p {
    margin-top: 0;
    color: #aaa;
    font-size: 1rem;
    letter-spacing: normal;
    text-transform: none;
    line-height: 1.5;
}
@keyframes pulse {
    0% {
        transform: scale(2);
        opacity: 0.7;
    }
    50% {
        transform: scale(2.1);
        opacity: 1;
    }
    100% {
        transform: scale(2);
        opacity: 0.7;
    }
}
@keyframes pulse-error {
    0% {
        fill: #ff5555;
    }
    50% {
        fill: #f00a0a;
    }
    100% {
        fill: #ff5555;
    }
}
.stats span.connecting {
    color: #f0a30a;
}
.stats span.connected {
    color: #7be141;
}
.stats span.error {
    color: #ff5555;
}
.hover-tooltip {
    position: absolute;
    background-color: #3a3a3a;
    border: 1px solid #666;
    border-radius: 4px;
    padding: 6px 10px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    color: #e0e0e0;
    font-size: 12px;
    pointer-events: none;
    white-space: nowrap;
}
.hover-tooltip a {
    color: inherit;
    text-decoration: none;
}
.hover-tooltip a:hover {
    text-decoration: underline;
}
.context-menu {
    position: absolute;
    background-color: #2c2c2c;
    border: 1px solid var(--border-hover);
    border-radius: 5px;
    min-width: 200px;
    z-index: 10000;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    color: #e0e0e0;
    font-size: 14px;
    padding: 5px 0;
    transform-origin: top left;
    backdrop-filter: blur(10px);
    background-color: rgba(44, 44, 44, 0.95);
}
.context-menu-anim-enter-active,
.context-menu-anim-leave-active {
    transition: transform var(--transition-speed) ease,
        opacity var(--transition-speed) ease;
}
.context-menu-anim-enter-from,
.context-menu-anim-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
.context-menu-header {
    padding: 8px 12px;
    font-weight: bold;
    color: var(--primary-color);
    margin-bottom: 5px;
    transition: all var(--transition-speed) ease;
}

.context-menu-header:hover {
    background-color: rgba(123, 225, 65, 0.1);
}

.context-menu-separator {
    height: 1px;
    background-color: var(--border-color);
    margin: 5px 0;
}
.context-menu-section {
    padding: 8px 12px;
    font-size: 11px;
    text-transform: uppercase;
    color: #999;
}
.context-menu-item {
    padding: 8px 12px;
    cursor: pointer;
    transition: all var(--transition-speed) ease;
    position: relative;
}

.context-menu-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 3px;
    height: 0;
    background: var(--primary-color);
    transform: translateY(-50%);
    transition: height 0.2s ease;
}

.context-menu-item:hover::before {
    height: 70%;
}

.context-menu-item.danger {
    color: var(--danger-color);
}

.context-menu-item.danger::before {
    background: var(--danger-color);
}

.context-menu-item:hover {
    background-color: rgba(123, 225, 65, 0.15);
    color: var(--primary-color);
    padding-left: 16px;
}
.context-menu-item.danger:hover {
    background-color: rgba(255, 85, 85, 0.15);
    color: var(--danger-color);
}
.context-menu-list {
    max-height: 200px;
    overflow-y: auto;
}
.context-menu-list::-webkit-scrollbar {
    width: 5px;
}
.context-menu-list::-webkit-scrollbar-track {
    background: #2c2c2c;
}
.context-menu-list::-webkit-scrollbar-thumb {
    background: var(--border-hover);
    border-radius: 3px;
}

.context-menu-list::-webkit-scrollbar-thumb:hover {
    background: var(--primary-color);
}

.context-menu-item-small {
    padding: 6px 16px;
    font-size: 12px;
    cursor: pointer;
    transition: all var(--transition-speed) ease;
}
.context-menu-item-small:hover {
    background-color: rgba(123, 225, 65, 0.1);
    color: var(--primary-color);
    padding-left: 20px;
}
.project-selector {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    position: relative;
    animation: slideDown 0.4s ease-out;
}
.project-selector select {
    position: relative;
    z-index: 100;
    cursor: pointer;
}

.project-selector select:hover {
    transform: translateY(-1px);
}

.new-project {
    display: flex;
    flex-shrink: 0;
}
.new-project input {
    width: 150px;
    margin-bottom: 0;
    border-radius: 4px 0 0 4px;
    border-right: none;
}
.new-project button {
    width: 40px;
    margin-bottom: 0;
    border-radius: 0 4px 4px 0;
    font-size: 20px;
    line-height: 1;
    padding: 0;
}

.new-project button:hover {
    transform: scale(1.05);
}
</style>
