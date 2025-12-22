<script setup>
import { ref } from 'vue'
import { useProductStore } from '@/stores/product'
import { storeToRefs } from 'pinia'

const productStore = useProductStore()
const { recommendation } = storeToRefs(productStore)

const userInput = ref('')
const isLoading = ref(false)
const showResult = ref(false)

const handleRecommend = async () => {
    if (!userInput.value.trim()) return

    isLoading.value = true
    showResult.value = false
    
    // API 호출 (Store Action)
    const success = await productStore.recommendProducts(userInput.value)
    
    isLoading.value = false
    if (success) {
        showResult.value = true
    }
}
</script>

<template>
    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-xl p-8 text-white min-h-[600px] flex flex-col items-center justify-center">
        <!-- 1. 입력 단계 -->
        <div v-if="!isLoading && !showResult" class="max-w-lg w-full text-center transition-all duration-500">
            <i class="fa-solid fa-robot text-6xl mb-6 text-indigo-200 animate-bounce"></i>
            <h2 class="text-3xl font-bold mb-4">AI 금융 상품 추천</h2>
            <p class="mb-8 text-indigo-100">"결혼 자금으로 3천만원을 모으고 싶어"<br>원하시는 목표를 자유롭게 이야기해 주세요.</p>
            
            <div class="relative">
                <input 
                    v-model="userInput" 
                    @keyup.enter="handleRecommend" 
                    type="text" 
                    class="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none shadow-lg placeholder-gray-400" 
                    placeholder="예: 1년 동안 안전하게 목돈 굴리기"
                >
                <button 
                    @click="handleRecommend" 
                    class="absolute right-2 top-2 bg-indigo-600 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-indigo-800 transition"
                >
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>

        <!-- 2. 로딩 단계 -->
        <div v-else-if="isLoading" class="text-center animate-pulse">
            <i class="fa-solid fa-circle-notch fa-spin text-5xl mb-4 text-white"></i>
            <h3 class="text-xl font-bold">AI가 고객님의 니즈를 분석 중입니다...</h3>
            <p class="text-indigo-200 mt-2">최적의 상품 데이터를 검색하고 있습니다.</p>
        </div>

        <!-- 3. 결과 단계 (API Response 표시) -->
        <div v-else class="max-w-2xl w-full bg-white text-gray-800 p-8 rounded-xl shadow-2xl animate-fade-in-up">
            <div class="flex items-center justify-between mb-6 border-b pb-4">
                <div class="flex items-center">
                    <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mr-2">AI Analysis</span>
                    <h3 class="text-xl font-bold text-indigo-900">추천 결과 리포트</h3>
                </div>
                <button @click="showResult = false; userInput = ''" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-redo"></i> 다시하기</button>
            </div>

            <!-- 분석 결과 -->
            <div class="mb-6 bg-gray-50 p-4 rounded-lg">
                <h4 class="font-bold text-gray-700 mb-2"><i class="fa-solid fa-magnifying-glass-chart mr-2"></i>분석 요약</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="text-gray-500">목적:</span> <span class="font-medium">{{ recommendation?.analysis.purpose }}</span></div>
                    <div><span class="text-gray-500">목표 금액:</span> <span class="font-medium">{{ recommendation?.analysis.target_amount.toLocaleString() }}원</span></div>
                    <div><span class="text-gray-500">투자 성향:</span> <span class="font-medium text-blue-600">{{ recommendation?.analysis.risk_profile }}</span></div>
                </div>
            </div>

            <!-- 추천 상품 목록 -->
            <h4 class="font-bold text-gray-700 mb-3"><i class="fa-solid fa-thumbs-up mr-2"></i>추천 상품</h4>
            <div class="space-y-3">
                <div v-for="prod in recommendation?.products" :key="prod.id" class="border border-indigo-100 rounded-lg p-4 hover:bg-indigo-50 transition flex justify-between items-center">
                    <div>
                        <div class="text-xs font-bold text-indigo-600">{{ prod.kor_co_nm }}</div>
                        <div class="font-bold">{{ prod.fin_prdt_nm }}</div>
                        <div class="text-sm text-gray-500">가입기간: {{ prod.save_trm }}개월</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-gray-500">예상 금리</div>
                        <div class="text-xl font-bold text-indigo-600">{{ prod.intr_rate }}%</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>