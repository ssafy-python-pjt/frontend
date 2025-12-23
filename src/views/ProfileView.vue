<script setup>
import { onMounted, ref, watch, computed } from 'vue' 
import { useAuthStore } from '@/stores/auth'
import Chart from 'chart.js/auto'

const authStore = useAuthStore()
const chartCanvas = ref(null)
const isEditingProfile = ref(false)

// 폼 초기화 시 안전하게 접근
const profileForm = ref({
    age: authStore.user?.age || 0,
    salary: authStore.user?.salary || 0,
    money: authStore.user?.money || 0
})

let chartInstance = null

const renderChart = () => {
    if (!chartCanvas.value || !authStore.user?.products) return
    if (chartInstance) chartInstance.destroy()

    const products = authStore.user.products
    const labels = products.map(p => p.fin_prdt_nm)
    const data = products.map(p => p.options[p.options.length - 1]?.["intr_rate2"] || p.options[p.options.length - 1]?.["intr_rate"] || 0)

    chartInstance = new Chart(chartCanvas.value, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: '가입 상품 금리(%)',
                data,
                backgroundColor: '#4F46E5',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { callback: function(value) { return value + "%" } } 
                }
            }
        }
    })
}

onMounted(() => {
    authStore.fetchProfile() 
    renderChart()
})

const getMaturityDate = (joinDate, months) => {
    if (!joinDate || !months) return '가입일 정보 없음'
    const date = new Date(joinDate)
    date.setMonth(date.getMonth() + months)
    return date.toLocaleDateString()
}

const financialSummary = computed(() => {
    let totalDeposit = 0
    let totalInterest = 0

    authStore.user?.joined_details?.forEach(item => {
        const amount = item.amount || 0
        const rate = item.product.options[0]?.intr_rate2 || 0
        totalDeposit += amount
        totalInterest += (amount * (rate / 100))
    })

    return { totalDeposit, totalInterest }
})

const investmentReport = computed(() => {
    const salary = authStore.user?.salary || 0
    const assets = authStore.user?.money || 0
    const savingRate = (financialSummary.value.totalDeposit / salary) * 100

    if (savingRate > 50) return { type: "열정적 저축가", desc: "소득의 절반 이상을 저축하고 계시네요! 공격적인 자산 형성이 돋보입니다." }
    if (assets > salary * 3) return { type: "안정적 자산가", desc: "보유 자산이 연봉 대비 높습니다. 지키는 투자와 절세 상품을 추천합니다." }
    return { type: "성장하는 투자자", desc: "차근차근 자산을 쌓아가고 있습니다. 복리 효과를 노려보세요." }
})

const saveProfile = async () => {
    const success = await authStore.updateProfile(profileForm.value)
    if (success) {
        isEditingProfile.value = false 
    }
}

watch(() => authStore.user, () => renderChart(), { deep: true })
</script>

<template>
  <div class="space-y-6 p-4">
    <div class="bg-white p-6 rounded-xl shadow-sm">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">내 정보 관리</h3>
            <button @click="isEditingProfile = !isEditingProfile" class="text-indigo-600 border border-indigo-600 px-3 py-1 rounded">
                {{ isEditingProfile ? '취소' : '수정' }}
            </button>
        </div>
        
        <div v-if="!isEditingProfile" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><p class="text-gray-500 text-sm">나이</p><p class="font-bold">{{ authStore.user?.age || 0 }}세</p></div>
            <div><p class="text-gray-500 text-sm">연봉</p><p class="font-bold">{{ authStore.user?.salary?.toLocaleString() || 0 }}원</p></div>
            <div><p class="text-gray-500 text-sm">자산</p><p class="font-bold">{{ authStore.user?.money?.toLocaleString() || 0 }}원</p></div>
        </div>
        
        <div v-else class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input v-model="profileForm.age" type="number" class="border p-2 rounded" placeholder="나이">
                <input v-model="profileForm.salary" type="number" class="border p-2 rounded" placeholder="연봉">
                <input v-model="profileForm.money" type="number" class="border p-2 rounded" placeholder="현재 자산">
            </div>
            <button @click="saveProfile" class="bg-indigo-600 text-white w-full py-2 rounded mt-2 font-bold">저장하기</button>
        </div>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm">
        <h3 class="text-xl font-bold mb-4">가입 상품 상세 설정</h3>
        <div v-if="authStore.user?.joined_details?.length" v-for="item in authStore.user.joined_details" :key="item.id" class="border-b py-4 last:border-0">
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="text-xs font-bold text-blue-600">{{ item.product.kor_co_nm }}</span>
                    <h4 class="font-bold">{{ item.product.fin_prdt_nm }}</h4>
                </div>
                <button @click="authStore.terminateProduct(item.id)" class="text-red-500 text-sm hover:underline">해지하기</button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label class="text-xs text-gray-500">가입일</label>
                    <input type="date" v-model="item.joined_at" class="w-full border p-1 rounded text-sm">
                </div>
                <div>
                    <label class="text-xs text-gray-500">만기일(예정)</label>
                    <p class="text-sm font-bold text-indigo-600">{{ getMaturityDate(item.joined_at, item.product.options[0]?.save_trm) }}</p>
                </div>
                <div v-if="item.product.fin_prdt_nm.includes('적금')">
                    <label class="text-xs text-gray-500">월 납입액</label>
                    <input type="number" v-model="item.monthly_payment" class="w-full border p-1 rounded text-sm" placeholder="원">
                </div>
                <div>
                    <label class="text-xs text-gray-500">총 예금/납입액</label>
                    <input type="number" v-model="item.amount" class="w-full border p-1 rounded text-sm" placeholder="원">
                </div>
            </div>
        </div>
        <div v-else class="text-center py-10 text-gray-400">가입된 상품이 없습니다.</div>
    </div>

    <div class="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
        <h3 class="text-xl font-bold text-indigo-900 mb-4">💰 나의 금융 요약</h3>
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <p class="text-gray-500 text-sm">총 예/적금액</p>
                <p class="text-xl font-bold">{{ financialSummary.totalDeposit.toLocaleString() }}원</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <p class="text-gray-500 text-sm">예상 금융 이익</p>
                <p class="text-xl font-bold text-green-600">+{{ financialSummary.totalInterest.toLocaleString() }}원</p>
            </div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
            <h4 class="font-bold text-indigo-600">AI 투자 성향 분석: {{ investmentReport.type }}</h4>
            <p class="text-gray-600 text-sm mt-1">{{ investmentReport.desc }}</p>
        </div>
    </div>
  </div>
</template>