<template>
  <Button
    label="Nouveau commentaire"
    rounded
    outlined
    @click="openForm('comment')"
  >
    <template #default>
      <div class="flex items-center">
        <AppIcon
          class="-ml-1 mr-1"
          icon-name="commentAdd"
        />
        Ajouter un commentaire
      </div>
    </template>
  </Button>
  <!-- Bouton pour ouvrir le formulaire de demande de modification -->
  <Button
    class="mt-2"
    label="Demander une modification"
    rounded
    outlined
    @click="openForm('edit')"
  >
    <AppIcon
      class="-ml-1 mr-1"
      icon-name="edit"
    />
    Demander une modification
  </Button>
  <!-- Formulaire d'ajout de commentaire -->
  <Dialog
    v-model:visible="formVisible"
    modal
    closable
    class="w-full max-w-[30rem]"
    :header="formType === 'comment'
      ? props.family.comment_form.title
      : 'Demander une modification'"
    :content-props="{ onClick: (event: Event) => { event.stopPropagation() } }"
  >
    <form
      v-if="formType === 'comment' && curr_page == 0"
      class="flex grow flex-col gap-4"
      @submit.prevent="curr_page+=1"
    >
      <span v-if="props.family.comment_form.help">{{ props.family.comment_form.help }}</span>
      <AdminInputTextField
        id="author"
        v-model="editedComment!.author"
        label="Auteurice"
      />

      <div class="flex flex-col gap-2">
        <label for="comment_text">Texte du commentaire<RequiredIndicator /></label>
        <ViewerRichTextEditor
          id="comment_text"
          v-model="editedComment!.text"
          label="Texte du commentaire"
        />
      </div>

      <span class="flex gap-1 justify-end">
        <Button
          label="Suivant"
          type="submit"
          outlined
          :disabled="!isCommentPageValid(0)"
        />
      </span>
    </form>

    <!-- Formulaire de demande de modification -->
    <form
      v-if="formType === 'edit'"
      class="flex grow flex-col gap-4"
      @submit.prevent="sendEditRequest"
    >
      <AdminInputTextField
        id="request_author"
        v-model="editRequest.author"
        label="Auteurice"
      />

      <div class="flex flex-col gap-2">
        <label for="request_type">Type de modification<RequiredIndicator /></label>
        <select
          id="request_type"
          v-model="editRequest.type"
          class="border p-2 rounded-md"
          required
        >
          <option
            disabled
            value=""
          >
            -- Veuillez choisir --
          </option>
          <option value="Cessation d'activité">
            Cessation d'activité
          </option>
          <option value="Déménagement">
            Déménagement
          </option>
          <option value="Erreur dans les informations (horaires, coordonnées, etc.)">
            Erreur dans les informations (horaires, coordonnées, etc.)
          </option>
          <option value="Autre">
            Autre
          </option>
        </select>
      </div>

      <div class="flex flex-col gap-2">
        <label for="request_text">Commentaire supplémentaire<RequiredIndicator v-if="editRequest.type === 'Autre'" /></label>
        <ViewerRichTextEditor
          id="request_text"
          v-model="editRequest.text"
          label="Votre demande"
        />
      </div>

      <span class="flex gap-1 justify-end">
        <!-- Bouton d'envoi -> désactivé si les champs requis ne sont pas remplis -->
        <Button
          label="Envoyer"
          type="submit"
          outlined
          :loading="processingRequest"
          :disabled="!editRequest.type || !isValidText(editRequest.author) || (editRequest.type === 'Autre' && !editRequest.text)"
        />
      </span>
    </form>
    <form
      v-for="page in Array.from({ length: page_count+1 }, (_, i) => i+1)"
      :key="`Page ${page}`"
      class="flex grow flex-col gap-4 max-w-[30rem]"
      @submit.prevent="() => page == page_count ? onSave() : curr_page+=1"
    >
      <div
        v-if="curr_page == page"
        class="flex grow flex-col gap-4 max-w-[30rem]"
      >
        <template v-if="page < page_count + 1">
          <FormDynamicField
            v-for="field in commentFieldsSortedByPage(page)
              .filter(field => field.categories == null || field.categories.includes(props.entity.category_id))"
            :key="field.key"
            v-model:field-content="(editedComment!.data as EntityOrCommentData)[field.key]"
            :form-field="(field as FormField)"
            @is-valid="isValid => commentFieldValid[field.key]= isValid"
          />

          <span
            class="flex gap-1 justify-end"
          >
            <Button
              label="Précédent"
              outlined
              @click="curr_page -= 1"
            />
            <Button
              :label="page == page_count ? 'Sauvegarder' : 'Suivant'"
              type="submit"
              :outlined="page != page_count"
              :loading="processingRequest"
              :disabled="processingRequest || !isCommentPageValid(page)"
            />
          </span>
        </template>
        <div
          v-else
          class="flex flex-col justify-center items-center "
        >
          <div class="text-center font-bold">
            Une petite seconde, on doit vérifier que vous n'êtes pas un robot...
          </div>

          <div class="m-3">
            <vue-hcaptcha
              :sitekey="state.hCaptchaSiteKey"
              @verify="hCaptchaVerify"
              @expired="hCaptchaExpired"
              @error="hCaptchaError"
            />
          </div>
        </div>
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import type { EntityOrCommentData, Family, FormField, PublicEntity, PublicNewComment, ViewerSearchedCachedEntity } from '~/lib'
import { isValidRichText, isValidText } from '~/lib/validation'
import state from '~/lib/viewer-state'

const formVisible = ref(false)

const props = defineProps<{
  family: Family
  entity: PublicEntity | ViewerSearchedCachedEntity
}>()

const processingRequest = ref(false)
const toast = useToast()

const editedComment = ref<PublicNewComment>()

const curr_page = ref(0)
const page_count = ref(0)

const commentFieldValid = ref(
  props.family.comment_form.fields
    .reduce((acc, field) => {
      acc[field.key] = !field.mandatory
      return acc
    }, {} as Record<string, boolean>),
)

// Définition du type de formulaire (ajout de commentaire ou demande de modification)
const formType = ref<'comment' | 'edit'>('comment')

// Fonction d'ouverture du formulaire avec le type spécifié
function openForm(type: 'comment' | 'edit') {
  formType.value = type
  formVisible.value = true
}

// Définition des références pour la demande de modification
const editRequest = ref({
  author: '',
  type: '',
  text: '',
})

function reset_refs(new_entity_id: string) {
  editedComment.value = {
    author: '',
    data: {},
    entity_id: new_entity_id,
    text: '',
    entity_category_id: props.entity.category_id,
  }
  curr_page.value = 0
  page_count.value = Math.max(0, ...props.family.comment_form.fields.map(field => field.form_page))
}
reset_refs(props.entity.id)

watch(
  () => props.entity,
  (newEntity, _) => {
    reset_refs(newEntity.id)
  },
)

watch(
  () => formVisible.value,
  (__, _) => {
    curr_page.value = Math.min(curr_page.value, page_count.value)
  },
)

function commentFieldsSortedByPage(page: number) {
  return props.family.comment_form.fields
    .filter(field => field.form_page === page)
    .sort((field_a, field_b) => field_a.form_weight - field_b.form_weight)
}

function isCommentPageValid(page: number) {
  if (page === 0) {
    return isValidText(editedComment.value!.author) && isValidRichText(editedComment.value!.text)
  }
  return commentFieldsSortedByPage(page)
    .filter(field => field.categories == null || field.categories.includes(editedComment.value!.entity_category_id))
    .every(field => commentFieldValid.value[field.key])
}

function hCaptchaVerify(token: string) {
  realOnSave(token)
}

function hCaptchaExpired() {
  toast.add({
    severity: 'error',
    summary: 'Erreur',
    detail: 'Le captcha a expiré',
    life: 3000,
  })
}

function hCaptchaError() {
  toast.add({
    severity: 'error',
    summary: 'Erreur',
    detail: 'Erreur de validation du captcha',
    life: 3000,
  })
}

async function onSave() {
  if (state.hasSafeModeEnabled) {
    curr_page.value += 1
  }
  else {
    await realOnSave(null)
  }
}

async function realOnSave(token: string | null) {
  processingRequest.value = true
  try {
    await state.client.createComment({
      comment: editedComment.value!,
      hcaptcha_token: token,
    })
    formVisible.value = false
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Commentaire envoyé avec succès',
      life: 3000,
    })
    reset_refs(props.entity.id)
  }
  catch {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur de modification du commentaire',
      life: 3000,
    })
  }
  processingRequest.value = false
}

// Fonction d'envoi de la demande de modification de l'entité
async function sendEditRequest() {
  processingRequest.value = true

  try {
    // Construction du message final
    const finalMessage
      = `Bonjour, une modification a été demandée pour cette fiche : ${editRequest.value.type}\n\n`
        + `${editRequest.value.text || ''}`

    // Envoi au backend
    await state.client.createComment({
      comment: {
        author: editRequest.value.author,
        entity_id: props.entity.id,
        entity_category_id: props.entity.category_id,
        text: finalMessage,
        data: {},
      },
    })

    // Affichage d'un message de succès
    toast.add({
      severity: 'success',
      summary: 'Envoyé',
      detail: 'Votre demande de modification a été envoyée.',
      life: 3000,
    })

    // Reset formulaire
    formVisible.value = false
    editRequest.value = { author: '', type: '', text: '' }
  }
  // Affichage d'un message d'erreur en cas d'echec de l'envoi
  catch {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d’envoyer la demande.',
      life: 3000,
    })
  }

  processingRequest.value = false
}
</script>
