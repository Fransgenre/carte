<template>
  <div class="flex items-center gap-2 mt-1 -mb-1">
    <Button
      outlined
      severity="success"
      label="Ajouter une adresse"
      @click="addNewAddress"
    />
  </div>

  <DataTable
    v-if="props.locations.length"
    :value="props.locations"
  >
    <Column
      field="plain_text"
      header="Adresses"
      sortable
    />
    <Column>
      <template #body="slotProps">
        <div class="flex justify-end">
          <Button
            outlined
            rounded
            severity="warn"
            class="mr-1"
            @click="() => editAddress(slotProps.index)"
          >
            <template #icon>
              <AppIcon icon-name="edit" />
            </template>
          </Button>

          <Button
            outlined
            rounded
            severity="danger"
            @click="() => removeAddress(slotProps.index)"
          >
            <template #icon>
              <AppIcon icon-name="delete" />
            </template>
          </Button>
        </div>
      </template>
    </Column>
  </DataTable>

  <AddressDialog
    v-model:visible="displayAddressDialog"
    :address="editedLocation"
    @select="value => onAddressSelected(value)"
  />
</template>

<script setup lang="ts">
import type { UnprocessedLocation } from '~/lib'

const props = defineProps<{
  locations: UnprocessedLocation[]
}>()

const emit = defineEmits(['update:locations'])

const toast = useToast()

const displayAddressDialog = ref(false)

const editedIndex = ref<number | undefined>()
const editedLocation = ref<UnprocessedLocation | undefined>()

function addNewAddress() {
  editedIndex.value = undefined
  editedLocation.value = undefined
  displayAddressDialog.value = true
}

function editAddress(index: number) {
  editedIndex.value = index
  editedLocation.value = props.locations[index]
  displayAddressDialog.value = true
}

function removeAddress(index: number) {
  const locations = [...props.locations]
  locations.splice(index, 1)
  emit('update:locations', locations)
}

function onAddressSelected(address: UnprocessedLocation) {
  const isDuplicate = props.locations.some((loc, index) => {
    return index != editedIndex.value && loc.plain_text == address.plain_text
  })
  if (isDuplicate) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: `Addresse déjà présente`, life: 3000 })
    return
  }

  const locations = [...props.locations]
  if (editedIndex.value == undefined)
    locations.push({ ...address })
  else
    locations[editedIndex.value] = { ...address }
  emit('update:locations', locations)

  displayAddressDialog.value = false
}
</script>
