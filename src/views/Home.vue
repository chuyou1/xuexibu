<template>
  <div class="home-container">
    <div class="building">
      <div
        v-for="floor in store.floorOrder"
        :key="floor"
        class="floor-section"
      >
        <div
          class="floor-header"
          @click="toggleFloor(floor)"
        >
          <span class="floor-number">{{ floor }}</span>
          <span class="expand-icon">{{ expandedFloors.includes(floor) ? '▼' : '▶' }}</span>
          <span class="completion-status">
            {{ getFloorCompletion(floor) }}/{{ getFloorTotal(floor) }} 已完成
          </span>
        </div>

        <div v-if="expandedFloors.includes(floor)" class="floor-content">
          <div class="classroom-grid">
            <div
              v-for="room in store.classrooms[floor]"
              :key="room"
              class="classroom-card"
              :class="{ completed: isClassroomCompleted(floor, room) }"
              @click="goToClassroom(floor, room)"
            >
              <span class="room-number">{{ room }}</span>
              <span v-if="isClassroomCompleted(floor, room)" class="completed-badge">✓</span>
            </div>
            <button
              v-if="allowCustomClassroom(floor)"
              class="classroom-card add-btn"
              @click.stop="showAddInput[floor] = true"
            >
              <span class="add-icon">+</span>
            </button>
            <div v-if="showAddInput[floor]" class="add-input-container">
              <input
                v-model="newClassroom[floor]"
                type="text"
                placeholder="教室号"
                class="input"
                @keyup.enter="addNewClassroom(floor)"
                @blur="showAddInput[floor] = false"
              />
              <button class="confirm-btn" @click="addNewClassroom(floor)">✓</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="signature-section">
      <h3>检查人签名</h3>
      <div class="signature-list">
        <div
          v-for="name in store.signedNames"
          :key="name"
          class="signature-tag"
        >
          {{ name }}
          <span class="remove-btn" @click="removeSignature(name)">×</span>
        </div>
      </div>
      <div class="signature-input">
        <input
          v-model="newSignature"
          type="text"
          placeholder="输入姓名"
          class="input"
          @keyup.enter="addNewSignature"
        />
        <button class="btn btn-add" @click="addNewSignature">+</button>
      </div>
    </div>

    <div class="verification-section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="store.leaveVerified"
          class="checkbox"
        />
        <span>请假条均已核实</span>
      </label>
      <span v-if="!store.leaveVerified" class="warning-text">✗</span>
    </div>

    <div class="bottom-actions">
      <button class="btn btn-primary" @click="generateReport" :disabled="!canGenerateReport">
        生成督查表
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '../stores/inspection'

const router = useRouter()
const store = useInspectionStore()

const expandedFloors = ref([])
const newClassroom = ref({})
const newSignature = ref('')
const showAddInput = ref({})

const {
  addClassroom,
  addSignature,
  removeSignature,
  resetAll
} = store

function getFloorCompletion(floor) {
  return store.completedClassrooms.filter(key => key.startsWith(floor)).length
}

function isClassroomCompleted(floor, room) {
  return store.completedClassrooms.includes(`${floor}-${room}`)
}

function toggleFloor(floor) {
  const index = expandedFloors.value.indexOf(floor)
  if (index > -1) {
    expandedFloors.value.splice(index, 1)
  } else {
    expandedFloors.value.push(floor)
  }
}

function allowCustomClassroom(floor) {
  return floor === '6-8F' || floor === '9F'
}

function getFloorTotal(floor) {
  return store.classrooms[floor].length
}

function goToClassroom(floor, room) {
  router.push({ name: 'ClassroomDetail', params: { floor, room } })
}

function addNewClassroom(floor) {
  const room = newClassroom.value[floor]
  if (room && room.trim()) {
    addClassroom(floor, room.trim())
    newClassroom.value[floor] = ''
    showAddInput.value[floor] = false
  }
}

function addNewSignature() {
  if (newSignature.value.trim()) {
    addSignature(newSignature.value.trim())
    newSignature.value = ''
  }
}

const canGenerateReport = computed(() => {
  return Object.keys(store.classroomData).length > 0
})

function generateReport() {
  if (canGenerateReport.value) {
    router.push('/report')
  }
}

function scheduleReset() {
  const now = new Date()
  let nextReset
  const hour = now.getHours()
  
  if (hour < 12) {
    nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
  } else if (hour < 24) {
    nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0, 0)
  } else {
    nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0)
  }
  
  const delay = nextReset.getTime() - now.getTime()
  
  setTimeout(() => {
    resetAll()
    scheduleReset()
  }, delay)
}

onMounted(() => {
  scheduleReset()
})
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-primary {
  background-color: white;
  color: #333;
  border: 2px solid #333;
}

.btn-primary:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #333;
}

.btn-primary:disabled {
  background-color: #f5f5f5;
  border-color: #ddd;
  cursor: not-allowed;
}

.btn-add {
  background-color: white;
  color: #333;
  border: 2px dashed #ccc;
  padding: 0.3rem 0.8rem;
  font-size: 1.2rem;
}

.btn-add:hover {
  background-color: #f5f5f5;
}

.floor-section {
  margin-bottom: 0.5rem;
}

.floor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: white;
  color: #333;
  padding: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #ddd;
}

.floor-header:hover {
  background-color: #f5f5f5;
}

.floor-number {
  font-size: 1.2rem;
  font-weight: bold;
}

.expand-icon {
  font-size: 0.8rem;
}

.completion-status {
  font-size: 0.9rem;
  opacity: 0.8;
}

.floor-content {
  background-color: white;
  padding: 1rem;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.classroom-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.classroom-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid #ddd;
}

.classroom-card:hover {
  background-color: #f5f5f5;
  border-color: #999;
}

.classroom-card.completed {
  background-color: #f0fff0;
  border-color: #999;
}

.classroom-card.add-btn {
  padding: 0.75rem 1rem;
  border-color: #ccc;
  border-style: dashed;
}

.classroom-card.add-btn:hover {
  background-color: #f5f5f5;
}

.room-number {
  font-weight: bold;
  color: #333;
}

.add-icon {
  font-size: 1.5rem;
  color: #666;
}

.completed-badge {
  font-size: 0.75rem;
  background-color: #666;
  color: white;
  padding: 0.125rem 0.4rem;
  border-radius: 50%;
  font-weight: bold;
}

.add-input-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input {
  padding: 0.5rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  min-width: 100px;
}

.confirm-btn {
  background-color: white;
  color: #333;
  border: 2px solid #333;
  border-radius: 4px;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
  font-weight: bold;
}

.signature-section {
  margin-top: 2rem;
  background-color: white;
  padding: 1.5rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.signature-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.signature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.signature-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: #333;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.remove-btn {
  cursor: pointer;
  font-size: 1rem;
  padding: 0 0.25rem;
}

.signature-input {
  display: flex;
  gap: 0.5rem;
}

.signature-input .input {
  flex: 1;
}

.verification-section {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
}

.checkbox {
  width: 1.25rem;
  height: 1.25rem;
}

.warning-text {
  color: #dc3545;
  font-weight: bold;
  font-size: 1.2rem;
}

.bottom-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  padding-bottom: 2rem;
}

.bottom-actions .btn-primary {
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
}
</style>