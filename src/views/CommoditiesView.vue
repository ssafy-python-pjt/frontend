<script setup>
import { ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'

const chartRef = ref(null)
const activeTab = ref('gold')
let chartInstance = null

// CSV 데이터를 파싱하는 함수
const parseCSV = (csvText) => {
    const lines = csvText.split('\n')
    const result = []
    
    // 헤더(첫 줄) 건너뛰고 데이터 파싱
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        // CSV 분리 정규식 (따옴표 내의 쉼표는 무시하고 분리)
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        
        if (parts.length >= 2) {
            const dateStr = parts[0].trim()
            let priceStr = parts[1].trim()
            
            // 가격 데이터 전처리 (따옴표, 쉼표 제거)
            priceStr = priceStr.replace(/[" ,]/g, '')
            const price = parseFloat(priceStr)
            
            if (dateStr && !isNaN(price)) {
                result.push({ date: dateStr, value: price })
            }
        }
    }
    
    // 날짜 기준 오름차순 정렬
    result.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return {
        labels: result.map(item => item.date),
        data: result.map(item => item.value)
    }
}

// 데이터 로드 및 차트 렌더링
const loadAndRenderChart = async () => {
    if (!chartRef.value) return

    // 기존 차트가 있다면 삭제
    if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
    }

    try {
        // 1. CSV 파일 가져오기 (public/gold_silver_prices 폴더 내 파일)
        const fileName = activeTab.value === 'gold' ? 'Gold.csv' : 'Silver.csv'
        const response = await fetch(`/gold_silver_prices/${fileName}`)
        
        if (!response.ok) {
            throw new Error(`파일을 찾을 수 없습니다: ${fileName}`)
        }

        const csvText = await response.text()
        
        // 2. 데이터 파싱
        const { labels, data } = parseCSV(csvText)
        
        // 3. 차트 그리기
        const ctx = chartRef.value.getContext('2d')
        const color = activeTab.value === 'gold' ? '#FFD700' : '#C0C0C0'
        const label = activeTab.value === 'gold' ? '금 시세 (USD/oz)' : '은 시세 (USD/oz)'

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + '33', // 투명도 20%
                    fill: true,
                    tension: 0.1, // 선 곡률
                    pointRadius: 0, // 데이터 포인트 숨김 (데이터가 많으므로)
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        display: true,
                        title: { display: true, text: 'Date' },
                        ticks: {
                            maxTicksLimit: 12 // X축 라벨 너무 많지 않게 조절
                        }
                    },
                    y: {
                        display: true,
                        title: { display: true, text: 'Price (USD)' }
                    }
                }
            }
        })

    } catch (error) {
        console.error('차트 로딩 실패:', error)
        // 에러 시 사용자에게 알림을 표시하거나 빈 차트를 유지할 수 있습니다.
        const ctx = chartRef.value.getContext('2d')
        ctx.font = '16px Arial'
        ctx.fillStyle = 'gray'
        ctx.fillText('데이터를 불러올 수 없습니다. (public/gold_silver_prices 폴더 확인 필요)', 50, 50)
    }
}

onMounted(() => {
    loadAndRenderChart()
})

watch(activeTab, () => {
    loadAndRenderChart()
})
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm">
    <h2 class="text-2xl font-bold mb-6">국제 시세 조회</h2>
    <div class="flex gap-4 mb-6">
        <button @click="activeTab='gold'" :class="activeTab==='gold' ? 'ring-2 ring-yellow-400 bg-yellow-50' : 'bg-gray-50'" class="flex-1 p-4 rounded-lg border text-center transition">
            <span class="text-2xl">🥇</span> <span class="font-bold block">Gold</span>
        </button>
        <button @click="activeTab='silver'" :class="activeTab==='silver' ? 'ring-2 ring-gray-400 bg-gray-50' : 'bg-gray-50'" class="flex-1 p-4 rounded-lg border text-center transition">
            <span class="text-2xl">🥈</span> <span class="font-bold block">Silver</span>
        </button>
    </div>
    
    <div class="h-80 w-full border rounded-lg p-4 relative">
        <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>