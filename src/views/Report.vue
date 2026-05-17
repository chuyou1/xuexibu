<template>
  <div class="report-container">
    <div class="back-link" @click="goBack">← 返回</div>

    <div class="report-header">
      <h1>计科院学风建设督查表</h1>
    </div>

    <div class="report-meta">
      <div class="meta-row">
        <span class="meta-label">日期：</span>
        <span class="meta-value">{{ currentDate }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">星期：</span>
        <span class="meta-value">{{ currentWeekday }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">节次：</span>
        <span class="meta-value">{{ currentPeriod }}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">检查人：</span>
        <span class="meta-value">{{ signedNames.join('、') }}</span>
      </div>
    </div>

    <div class="table-container">
      <table class="inspection-table">
        <thead>
          <tr>
            <th>班级</th>
            <th>辅导员</th>
            <th>考勤记录</th>
            <th>违纪情况</th>
            <th>总分</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(classroom, key) in collegeClassrooms"
            :key="key"
          >
            <td>{{ getClassInfo(key).className }}</td>
            <td>{{ getClassInfo(key).teacher }}</td>
            <td :class="{ highlight: getLeaveCount(classroom.attendance) > 5 }">
              {{ classroom.attendance || '-' }}
            </td>
            <td>{{ classroom.violations.length }}</td>
            <td>{{ classroom.score }}</td>
          </tr>
          <tr v-if="collegeClassrooms.length === 0">
            <td colspan="5" class="empty-cell">暂无计科院教室数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="hasViolations" class="violation-section">
      <h3>违纪情况详情</h3>
      
      <div v-if="collegeViolations.length > 0" class="violation-group">
        <h4>计科院教室违纪</h4>
        <div class="violation-detail-list">
          <div
            v-for="(item, index) in collegeViolations"
            :key="index"
            class="violation-detail"
          >
            <span class="violation-room">{{ item.room }}</span>
            <span class="violation-name">{{ item.name }}</span>
            <span class="violation-type">{{ getViolationLabel(item.type) }}</span>
            <span v-if="item.image" class="violation-image">📷</span>
          </div>
        </div>
      </div>

      <div v-if="otherViolations.length > 0" class="violation-group">
        <h4>非计科院教室卫生检查</h4>
        <div class="violation-detail-list">
          <div
            v-for="(item, index) in otherViolations"
            :key="index"
            class="violation-detail"
          >
            <span class="violation-room">{{ item.room }}</span>
            <span class="violation-type">{{ getViolationLabel(item.type) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" @click="exportToExcel">
        导出Excel
      </button>
      <button class="btn btn-secondary" @click="goBack">
        返回
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '../stores/inspection'
import * as XLSX from 'xlsx'

const router = useRouter()
const store = useInspectionStore()

const { classroomData, classrooms, floorOrder, signedNames, violationOptions } = store

const currentDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

const currentWeekday = computed(() => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `星期${weekdays[new Date().getDay()]}`
})

const currentPeriod = computed(() => {
  const hour = new Date().getHours()
  return hour < 12 ? '第1、2节' : '第5、6节'
})

const collegeClassrooms = computed(() => {
  const result = {}
  Object.keys(classroomData).forEach(key => {
    const data = classroomData[key]
    if (data.submitted && data.isCollegeClassroom) {
      result[key] = data
    }
  })
  return result
})

const otherClassrooms = computed(() => {
  const result = {}
  Object.keys(classroomData).forEach(key => {
    const data = classroomData[key]
    if (data.submitted && !data.isCollegeClassroom) {
      result[key] = data
    }
  })
  return result
})

const collegeViolations = computed(() => {
  const violations = []
  Object.keys(collegeClassrooms.value).forEach(key => {
    const data = collegeClassrooms.value[key]
    data.violations.forEach(v => {
      violations.push({
        room: key,
        name: v.name,
        type: v.type,
        image: v.image
      })
    })
  })
  return violations
})

const otherViolations = computed(() => {
  const violations = []
  Object.keys(otherClassrooms.value).forEach(key => {
    const data = otherClassrooms.value[key]
    data.violations.forEach(v => {
      violations.push({
        room: key,
        type: v.type
      })
    })
  })
  return violations
})

const hasViolations = computed(() => {
  return collegeViolations.value.length > 0 || otherViolations.value.length > 0
})

function getClassInfo(key) {
  const room = key.split('-')[1]
  return {
    className: `计科${room}班`,
    teacher: '待填写'
  }
}

function getLeaveCount(attendance) {
  if (!attendance) return 0
  const match = attendance.match(/请假(\d+)/)
  return match ? parseInt(match[1]) : 0
}

function getViolationLabel(value) {
  const opt = violationOptions.find(o => o.value === value)
  return opt ? opt.label : value
}

function exportToExcel() {
  const worksheetData = []
  
  worksheetData.push(['计科院学风建设督查表'])
  worksheetData.push([])
  worksheetData.push(['日期', currentDate.value])
  worksheetData.push(['星期', currentWeekday.value])
  worksheetData.push(['节次', currentPeriod.value])
  worksheetData.push(['检查人', signedNames.value.join('、')])
  worksheetData.push([])
  worksheetData.push(['班级', '辅导员', '考勤记录', '违纪情况', '总分'])
  
  Object.keys(collegeClassrooms.value).forEach(key => {
    const data = collegeClassrooms.value[key]
    worksheetData.push([
      getClassInfo(key).className,
      getClassInfo(key).teacher,
      data.attendance || '-',
      data.violations.length,
      data.score
    ])
  })
  
  if (hasViolations.value) {
    worksheetData.push([])
    worksheetData.push(['违纪情况详情'])
    
    if (collegeViolations.value.length > 0) {
      worksheetData.push(['计科院教室违纪'])
      collegeViolations.value.forEach(v => {
        worksheetData.push([v.room, v.name, getViolationLabel(v.type), v.image ? '有照片' : ''])
      })
    }
    
    if (otherViolations.value.length > 0) {
      worksheetData.push([])
      worksheetData.push(['非计科院教室卫生检查'])
      otherViolations.value.forEach(v => {
        worksheetData.push([v.room, getViolationLabel(v.type)])
      })
    }
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '学风督查表')
  XLSX.writeFile(workbook, `学风建设督查表_${currentDate.value}.xlsx`)
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.report-container {
  max-width: 1000px;
  margin: 0 auto;
}

.back-link {
  color: #3498db;
  cursor: pointer;
  margin-bottom: 1rem;
}

.report-header {
  text-align: center;
  margin-bottom: 2rem;
}

.report-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #2c3e50;
}

.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.meta-row {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: bold;
  color: #7f8c8d;
}

.meta-value {
  margin-left: 0.25rem;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.inspection-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.inspection-table th,
.inspection-table td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: center;
}

.inspection-table th {
  background-color: #34495e;
  color: white;
}

.inspection-table td.highlight {
  background-color: #ffebee;
  color: #c62828;
}

.empty-cell {
  text-align: center;
  color: #95a5a6;
}

.violation-section {
  background-color: white;
  padding: 1.5rem;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.violation-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.violation-group {
  margin-bottom: 1.5rem;
}

.violation-group:last-child {
  margin-bottom: 0;
}

.violation-group h4 {
  margin: 0 0 0.75rem 0;
  color: #34495e;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.violation-detail-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.violation-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.violation-room {
  font-weight: bold;
  color: #3498db;
}

.violation-name {
  color: #2c3e50;
}

.violation-type {
  color: #e74c3c;
}

.violation-image {
  font-size: 1.2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}
</style>