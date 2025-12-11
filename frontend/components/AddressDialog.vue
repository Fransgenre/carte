<template>
  <Dialog
    :visible="props.visible"
    header="Sélectionner une adresse"
    :modal="true"
    :closable="true"
    dismissable-mask
    :style="{ width: '40rem' }"
    @update:visible="value => emits('update:visible', value)"
  >
    <AddressPicker v-model="editedAddress" />
    <template #footer>
      <div class="pt-1">
        <Button
          label="Annuler"
          severity="secondary"
          @click="emits('update:visible', false)"
        />
        <Button
          label="Sélectionner"
          :disabled="!editedAddress"
          @click="editedAddress && emits('select', editedAddress)"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { UnprocessedLocation } from '~/lib'

const props = defineProps<{
  address: UnprocessedLocation | undefined
  visible: boolean
}>()

const emits = defineEmits<{
  'update:visible': [boolean]
  'select': [UnprocessedLocation]
}>()

const editedAddress = ref<UnprocessedLocation | undefined>(props.address)

watch([
  () => props.visible,
  () => props.address,
], () => {
  editedAddress.value = props.address
})
</script>
