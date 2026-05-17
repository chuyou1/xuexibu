import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useInspectionStore = defineStore('inspection', () => {
  const defaultClassrooms = {
    '9F': ['903', '904'],
    '6-8F': [],
    '5F': ['501', '502', '503', '504', '505', '506', '507'],
    '4F': ['401', '402', '403', '404', '405', '406', '407'],
    '3F': ['301', '302', '303', '304', '305', '306', '307'],
    '2F': ['202', '204', '207A', '207B', '208', '209', '210A', '210B']
  }

  const classrooms = ref(JSON.parse(JSON.stringify(defaultClassrooms)))
  const classroomData = ref({})
  const signedNames = ref([])
  const leaveVerified = ref(false)
  const reportGenerated = ref(false)

  const violationOptions = [
    { value: 'sleep', label: '睡觉', penalty: 0.5 },
    { value: 'food', label: '带餐', penalty: 0.5 },
    { value: 'hair', label: '染发', penalty: 0.5 },
    { value: 'noBook', label: '未带书', penalty: 0.5 },
    { value: 'phone', label: '玩手机', penalty: 0.5 },
    { value: 'clean', label: '卫生差', penalty: 0.5 }
  ]

  const floorOrder = ['9F', '6-8F', '5F', '4F', '3F', '2F']

  const completedClassrooms = computed(() => {
    return Object.keys(classroomData.value).filter(key => classroomData.value[key]?.submitted)
  })

  function getClassroomKey(floor, room) {
    return `${floor}-${room}`
  }

  function getClassroomData(floor, room) {
    const key = getClassroomKey(floor, room)
    return classroomData.value[key] || {
      attendance: '',
      violations: [],
      score: 100,
      submitted: false,
      isCollegeClassroom: true
    }
  }

  function saveClassroomData(floor, room, data) {
    const key = getClassroomKey(floor, room)
    classroomData.value[key] = { ...data }
  }

  function addClassroom(floor, room) {
    if (!classrooms.value[floor].includes(room)) {
      classrooms.value[floor].push(room)
      classrooms.value[floor].sort()
    }
  }

  function removeClassroom(floor, room) {
    const index = classrooms.value[floor].indexOf(room)
    if (index > -1) {
      classrooms.value[floor].splice(index, 1)
    }
  }

  function calculateScore(attendance, violations) {
    let score = 100
    const absentCount = (attendance.match(/旷课/g) || []).length
    score -= absentCount * 1
    score -= violations.length * 0.5
    return Math.max(0, score)
  }

  function addSignature(name) {
    if (!signedNames.value.includes(name)) {
      signedNames.value.push(name)
    }
  }

  function removeSignature(name) {
    const index = signedNames.value.indexOf(name)
    if (index > -1) {
      signedNames.value.splice(index, 1)
    }
  }

  function resetAll() {
    const newClassrooms = JSON.parse(JSON.stringify(defaultClassrooms))
    Object.keys(classrooms.value).forEach(key => {
      delete classrooms.value[key]
    })
    Object.assign(classrooms.value, newClassrooms)
    classroomData.value = {}
    signedNames.value = []
    leaveVerified.value = false
    reportGenerated.value = false
  }

  return {
    classrooms,
    classroomData,
    signedNames,
    leaveVerified,
    reportGenerated,
    violationOptions,
    floorOrder,
    completedClassrooms,
    getClassroomKey,
    getClassroomData,
    saveClassroomData,
    addClassroom,
    removeClassroom,
    calculateScore,
    addSignature,
    removeSignature,
    resetAll
  }
})