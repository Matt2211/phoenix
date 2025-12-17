import { ref } from 'vue'

const showForm = ref(false)

const openForm = () => {
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

export const useContactForm = () => {
  return {
    showForm,
    openForm,
    closeForm,
  }
}
