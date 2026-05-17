<template>
  <div class="detail-container">
    <div class="back-link" @click="goBack">← 返回教室列表</div>

    <div class="classroom-header">
      <h2>{{ floor }} - {{ room }}</h2>
      <span v-if="data.submitted" class="submitted-badge">已提交</span>
    </div>

    <div class="section">
      <h3>考勤记录</h3>
      <textarea
        v-model="localAttendance"
        class="textarea"
        placeholder="输入考勤记录（学委上传后可在此核对修改）"
        :readonly="data.submitted"
      ></textarea>
    </div>

    <div class="section">
      <h3>违纪情况</h3>
      <div class="violation-form" v-if="!data.submitted">
        <div class="form-row">
          <input
            v-model="newViolation.name"
            type="text"
            class="input"
            placeholder="姓名"
          />
          <select
            v-model="newViolation.type"
            class="select"
          >
            <option value="">选择违纪类型</option>
            <option v-for="opt in violationOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <input
            type="file"
            accept="image/*"
            class="file-input"
            @change="handleImageUpload"
          />
          <button class="btn btn-sm btn-primary" @click="addViolation" :disabled="!canAddViolation">
            添加
          </button>
        </div>
      </div>

      <div class="violation-list">
        <div
          v-for="(violation, index) in localViolations"
          :key="index"
          class="violation-item"
        >
          <span class="violation-name">{{ violation.name }}</span>
          <span class="violation-type">{{ getViolationLabel(violation.type) }}</span>
          <span v-if="violation.image" class="violation-image-badge">已上传照片</span>
          <button
            v-if="!data.submitted"
            class="btn btn-sm btn-danger"
            @click="removeViolation(index)"
          >
            删除
          </button>
        </div>
        <div v-if="localViolations.length === 0" class="empty-state">
          暂无违纪记录
        </div>
      </div>
    </div>

    <div class="section score-section">
      <h3>总分</h3>
      <div class="score-display">
        <span class="score-value">{{ localScore }}</span>
        <span class="score-label">分</span>
      </div>
      <div class="score-breakdown">
        <p>旷课次数：{{ absentCount }} 次 × 1分 = {{ absentCount }}分</p>
        <p>违纪次数：{{ localViolations.length }} 次 × 0.5分 = {{ localViolations.length * 0.5 }}分</p>
        <p>扣分总计：{{ absentCount + localViolations.length * 0.5 }}分</p>
      </div>
    </div>

    <div class="section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="localIsCollegeClassroom"
          :disabled="data.submitted"
          class="checkbox"
        />
        <span>是计科院上课教室</span>
      </label>
    </div>

    <div class="actions">
      <button
        v-if="!data.submitted"
        class="btn btn-primary"
        @click="submitData"
      >
        提交
      </button>
      <button
        v-if="data.submitted"
        class="btn btn-secondary"
        @click="editData"
      >
        修改
      </button>
      <button class="btn btn-secondary" @click="goBack">
        返回
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '../stores/inspection'

const route = useRoute()
const router = useRouter()
const store = useInspectionStore()

const floor = route.params.floor
const room = route.params.room

const { violationOptions, getClassroomData, saveClassroomData, calculateScore } = store

const data = ref(getClassroomData(floor, room))

const localAttendance = ref(data.value.attendance)
const localViolations = ref([...data.value.violations])
const localIsCollegeClassroom = ref(data.value.isCollegeClassroom)
const newViolation = ref({ name: '', type: '', image: null })

const absentCount = computed(() => {
  return (localAttendance.value.match(/旷课/g) || []).length
})

const localScore = computed(() => {
  return calculateScore(localAttendance.value, localViolations.value)
})

const canAddViolation = computed(() => {
  return newViolation.value.name.trim() && newViolation.value.type
})

function getViolationLabel(value) {
  const opt = violationOptions.find(o => o.value === value)
  return opt ? opt.label : value
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (file) {
    newViolation.value.image = file.name
  }
}

function addViolation() {
  if (canAddViolation.value) {
    localViolations.value.push({
      name: newViolation.value.name.trim(),
      type: newViolation.value.type,
      image: newViolation.value.image
    })
    newViolation.value = { name: '', type: '', image: null }
  }
}

function removeViolation(index) {
  localViolations.value.splice(index, 1)
}

function submitData() {
  saveClassroomData(floor, room, {
    attendance: localAttendance.value,
    violations: localViolations.value,
    score: localScore.value,
    submitted: true,
    isCollegeClassroom: localIsCollegeClassroom.value
  })
  router.push('/')
}

function editData() {
  saveClassroomData(floor, room, {
    ...data.value,
    submitted: false
  })
  router.push(`/classroom/${floor}/${room}`)
}

function goBack() {
  router.push('/')
}

watch([localAttendance, localViolations], () => {
  if (!data.value.submitted) {
    saveClassroomData(floor, room, {
      attendance: localAttendance.value,
      violations: localViolations.value,
      score: localScore.value,
      submitted: false,
      isCollegeClassroom: localIsCollegeClassroom.value
    })
  }
}, { deep: true })
</script>

<style scoped>
.detail-container {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  color: #3498db;
  cursor: pointer;
  margin-bottom: 1rem;
}

.classroom-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.classroom-header h2 {
  margin: 0;
  font-size: 1.8rem;
}

.submitted-badge {
  background-color: #28a745;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

.section {
  background-color: white;
  padding: 1.5rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
}

.textarea:readonly {
  background-color: #f8f9fa;
}

.violation-form {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.file-input {
  padding: 0.25rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.violation-list {
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.violation-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.violation-item:last-child {
  border-bottom: none;
}

.violation-name {
  font-weight: bold;
}

.violation-type {
  color: #7f8c8d;
}

.violation-image-badge {
  font-size: 0.75rem;
  background-color: #f39c12;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #95a5a6;
}

.score-section {
  text-align: center;
}

.score-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.score-value {
  font-size: 3rem;
  font-weight: bold;
  color: #e74c3c;
}

.score-label {
  font-size: 1.2rem;
}

.score-breakdown {
  text-align: left;
  border-top: 1px solid #eee;
  padding-top: 1rem;
}

.score-breakdown p {
  margin: 0.25rem 0;
  color: #7f8c8d;
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

.actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>