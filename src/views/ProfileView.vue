<script setup>
import { onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Chart from 'chart.js/auto'

const authStore = useAuthStore()
const chartCanvas = ref(null)
let chartInstance = null

const renderChart = () => {
    if (!chartCanvas.value || !authStore.user?.products) return
    if (chartInstance) chartInstance.destroy()

    const products = authStore.user.products
    const labels = products.map(p => p.fin_prdt_nm)
    const data = products.map(p => p.intr_rate2 || p.intr_rate || 0)

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
            scales: { y: { beginAtZero: true } }
        }
    })
}

onMounted(() => {
    authStore.fetchProfile() // 최신 정보 로드
    renderChart()
})

// 데이터 로딩 완료 시 차트 그리기
watch(() => authStore.user, () => renderChart(), { deep: true })
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- 회원 정보 -->
    <div class="bg-white p-6 rounded-xl shadow-sm h-fit">
        <div class="flex flex-col items-center">
            <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-500 mb-4">
                <i class="fa-solid fa-user"></i>
            </div>
            <h2 class="text-xl font-bold">{{ authStore.user?.username }}</h2>
            <p class="text-gray-500 text-sm">{{ authStore.user?.email }}</p>
            <div class="mt-4 w-full pt-4 border-t text-sm">
                <div class="flex justify-between mb-2"><span>보유 자산</span><span class="font-bold">{{ authStore.user?.assets?.toLocaleString() }}원</span></div>
            </div>
        </div>
    </div>

    <!-- 포트폴리오 -->
    <div class="md:col-span-2 bg-white p-6 rounded-xl shadow-sm">
        <h3 class="text-lg font-bold mb-4">내 금융 상품 포트폴리오</h3>
        <div v-if="authStore.user?.products?.length > 0">
            <div class="h-64 mb-6 relative">
                <canvas ref="chartCanvas"></canvas>
            </div>
            <ul class="space-y-2">
                <li v-for="p in authStore.user.products" :key="p.fin_prdt_cd" class="flex justify-between p-3 bg-gray-50 rounded">
                    <span>{{ p.fin_prdt_nm }}</span>
                    <span class="font-bold text-indigo-600">{{ p.intr_rate2 || p.intr_rate }}%</span>
                </li>
            </ul>
        </div>
        <div v-else class="text-center py-12 text-gray-400">
            가입한 상품이 없습니다. <br>
            <router-link to="/products" class="text-indigo-600 underline">상품 보러가기</router-link>
        </div>
    </div>
  </div>
</template>