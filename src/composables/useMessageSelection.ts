import { ref } from 'vue'

const isSelectionMode = ref(false)
const selectedMessageIds = ref<Set<string>>(new Set())

export function useMessageSelection() {
  const toggleSelectionMode = () => {
    isSelectionMode.value = !isSelectionMode.value
    selectedMessageIds.value.clear()
  }

  const toggleMessageSelection = (id: string) => {
    if (selectedMessageIds.value.has(id)) {
      selectedMessageIds.value.delete(id)
    } else {
      selectedMessageIds.value.add(id)
    }
  }

  const clearSelection = () => {
    selectedMessageIds.value.clear()
    isSelectionMode.value = false
  }

  return {
    isSelectionMode,
    selectedMessageIds,
    toggleSelectionMode,
    toggleMessageSelection,
    clearSelection
  }
}
