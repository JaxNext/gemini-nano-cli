<script setup lang="ts">
import { Attachments, Attachment, AttachmentPreview, AttachmentInfo, AttachmentRemove } from '@/components/ai-elements/attachments'
import { usePromptInput } from '@/components/ai-elements/prompt-input'

const { files, removeFile } = usePromptInput()
</script>

<template>
  <Attachments v-if="files.length > 0" variant="inline">
    <Attachment
      v-for="attachment in files"
      :key="attachment.id"
      :data="attachment"
      @remove="removeFile(attachment.id)"
    >
      <AttachmentPreview />
      <AttachmentInfo />
      <AttachmentRemove />
    </Attachment>
  </Attachments>
</template>