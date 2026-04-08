import { ref, onMounted, onUnmounted } from 'vue';
import { ChatEngine } from '../core/ChatEngine';
import type { Message, Session, GeminiNanoStatus } from '../core/types';

// Singleton instance so the state is shared across all components using this composable
const engineInstance = new ChatEngine();
let isInitialized = false;

export function useChatEngine() {
  const sessions = ref<Session[]>(engineInstance.sessions);
  const activeSessionId = ref<string | undefined>(engineInstance.activeSessionId);
  const messages = ref<Message[]>(engineInstance.messages);
  const isGenerating = ref<boolean>(engineInstance.isGenerating);
  const status = ref<GeminiNanoStatus>(engineInstance.status);
  const downloadProgress = ref<number>(engineInstance.downloadProgress);
  const tokensLeft = ref<number | null>(engineInstance.tokensLeft);

  const handleSessionsChanged = (newSessions: Session[]) => {
    sessions.value = [...newSessions];
  };
  const handleActiveSessionChanged = (id: string | undefined) => {
    activeSessionId.value = id;
  };
  const handleMessagesChanged = (newMessages: Message[]) => {
    messages.value = [...newMessages];
  };
  const handleGenerationStart = () => {
    isGenerating.value = true;
  };
  const handleGenerationEnd = () => {
    isGenerating.value = false;
  };
  const handleStatusChanged = (newStatus: GeminiNanoStatus) => {
    status.value = newStatus;
  };
  const handleDownloadProgressChanged = (newProgress: number) => {
    downloadProgress.value = newProgress;
  };
  const handleTokensLeftChanged = (newTokens: number | null) => {
    tokensLeft.value = newTokens;
  };

  onMounted(() => {
    engineInstance.on('sessions:changed', handleSessionsChanged);
    engineInstance.on('activeSession:changed', handleActiveSessionChanged);
    engineInstance.on('messages:changed', handleMessagesChanged);
    engineInstance.on('generation:start', handleGenerationStart);
    engineInstance.on('generation:end', handleGenerationEnd);
    engineInstance.on('status:changed', handleStatusChanged);
    engineInstance.on('downloadProgress:changed', handleDownloadProgressChanged);
    engineInstance.on('tokensLeft:changed', handleTokensLeftChanged);
    
    // sync initial state
    sessions.value = [...engineInstance.sessions];
    activeSessionId.value = engineInstance.activeSessionId;
    messages.value = [...engineInstance.messages];
    isGenerating.value = engineInstance.isGenerating;
    status.value = engineInstance.status;
    downloadProgress.value = engineInstance.downloadProgress;
    tokensLeft.value = engineInstance.tokensLeft;

    if (!isInitialized) {
      isInitialized = true;
      engineInstance.initialize().catch(err => {
        console.error('Failed to initialize ChatEngine:', err);
      });
    }
  });

  onUnmounted(() => {
    engineInstance.off('sessions:changed', handleSessionsChanged);
    engineInstance.off('activeSession:changed', handleActiveSessionChanged);
    engineInstance.off('messages:changed', handleMessagesChanged);
    engineInstance.off('generation:start', handleGenerationStart);
    engineInstance.off('generation:end', handleGenerationEnd);
    engineInstance.off('status:changed', handleStatusChanged);
    engineInstance.off('downloadProgress:changed', handleDownloadProgressChanged);
    engineInstance.off('tokensLeft:changed', handleTokensLeftChanged);
  });

  return {
    sessions,
    activeSessionId,
    messages,
    isGenerating,
    status,
    downloadProgress,
    tokensLeft,
    loadSession: (id: string) => engineInstance.loadSession(id),
    createNewSession: () => engineInstance.createNewSession(),
    deleteSession: (id: string) => engineInstance.deleteSession(id),
    renameSession: (id: string, title: string) => engineInstance.renameSession(id, title),
    sendMessage: (text: string, files?: any[]) => engineInstance.sendMessage(text, files),
    abortGeneration: () => engineInstance.abortGeneration()
  };
}
