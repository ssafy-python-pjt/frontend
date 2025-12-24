<script setup>
import { ref, computed } from 'vue' // [수정] computed 추가
import { useProductStore } from '@/stores/product'
import { storeToRefs } from 'pinia'
import ProductDetailModal from '@/components/ProductDetailModal.vue'

const productStore = useProductStore()
const { recommendation } = storeToRefs(productStore)

const userInput = ref('')
const isLoading = ref(false)
const showResult = ref(false)
const selectedProduct = ref(null)

// [추가] 키워드 파싱을 위한 Computed 속성
// AI가 문자열("a,b")로 주든, 배열(["a","b"])로 주든 안전하게 배열로 변환
const parsedKeywords = computed(() => {
    const raw = recommendation.value?.analysis?.keywords
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') return raw.split(',').map(k => k.trim())
    return []
})

const handleRecommend = async () => {
    if (!userInput.value.trim()) return

    isLoading.value = true
    showResult.value = false
    
    // API 호출
    const success = await productStore.recommendProducts(userInput.value)
    
    isLoading.value = false
    if (success) {
        showResult.value = true
    }
}

const openDetail = (product) => {
    selectedProduct.value = product
}
</script>

<template>
    <div class="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-xl p-8 text-white min-h-[600px] flex flex-col items-center justify-center relative">
        
        <div v-if="!isLoading && !showResult" class="max-w-2xl w-full text-center transition-all duration-500">
            <i class="fa-solid fa-robot text-6xl mb-6 text-indigo-200 animate-bounce"></i>
            <h2 class="text-3xl font-bold mb-4">AI 금융 상품 추천</h2>
            
            <div class="bg-white/10 p-6 rounded-xl mb-8 text-left border border-white/20 backdrop-blur-sm">
                <p class="text-indigo-100 font-bold mb-2 flex items-center">
                    <i class="fa-solid fa-lightbulb text-yellow-300 mr-2"></i> 
                    더 정확한 추천을 받는 팁
                </p>
                <p class="text-sm text-indigo-50 leading-relaxed opacity-80">
                    "내 집 마련을 위해 3년 동안 돈을 모으고 싶어. 월 50만원 정도 저축 가능해."<br>
                    이처럼 <span class="text-yellow-300 font-bold">목적, 기간, 금액</span>을 구체적으로 알려주시면 AI가 최적의 상품을 찾아드려요.
                </p>
            </div>
            
            <div class="flex flex-col gap-4">
                <textarea 
                    v-model="userInput" 
                    @keydown.enter.prevent="handleRecommend" 
                    class="w-full px-6 py-4 rounded-2xl text-gray-900 focus:outline-none shadow-lg placeholder-gray-400 text-lg resize-none h-32" 
                    placeholder="예: 30대 직장인이고 결혼 자금으로 1년 동안 1,000만원을 모으고 싶어요. 안정적인 예금 상품 추천해줘."
                ></textarea>
                
                <button 
                    @click="handleRecommend" 
                    class="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!userInput.trim()"
                >
                    <span>AI에게 추천받기</span>
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>

        <div v-else-if="isLoading" class="text-center animate-pulse">
            <i class="fa-solid fa-circle-notch fa-spin text-5xl mb-4 text-white"></i>
            <h3 class="text-xl font-bold">AI가 고객님의 니즈를 분석 중입니다...</h3>
            <p class="text-indigo-200 mt-2">최적의 금리 조건을 검색하고 있습니다.</p>
        </div>

        <div v-else class="max-w-3xl w-full bg-white text-gray-800 p-8 rounded-xl shadow-2xl animate-fade-in-up">
            <div class="flex items-center justify-between mb-6 border-b pb-4">
                <div class="flex items-center">
                    <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mr-2">AI Analysis</span>
                    <h3 class="text-xl font-bold text-indigo-900">추천 결과 리포트</h3>
                </div>
                <button @click="showResult = false; userInput = ''" class="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-bold">
                    <i class="fa-solid fa-redo"></i> 다시하기
                </button>
            </div>

            <div class="mb-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <h4 class="font-bold text-gray-700 mb-3 flex items-center">
                    <i class="fa-solid fa-magnifying-glass-chart mr-2 text-indigo-500"></i>
                    요청 분석
                </h4>
                <p class="text-gray-600 mb-2">
                    <span class="font-bold text-indigo-600">"{{ recommendation?.analysis?.purpose }}"</span> 
                    목적을 달성하기 위해,
                </p>
                <div class="flex flex-wrap gap-2">
                    <span v-for="keyword in parsedKeywords" :key="keyword"
                        class="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-500">
                        #{{ keyword.trim ? keyword.trim() : keyword }}
                    </span>
                </div>
            </div>

            <h4 class="font-bold text-gray-700 mb-3 flex items-center">
                <i class="fa-solid fa-thumbs-up mr-2 text-indigo-500"></i>
                AI 추천 상품 TOP 3
            </h4>
            <div class="space-y-4">
                <div v-for="(prod, idx) in recommendation?.products" :key="prod.fin_prdt_cd" 
                    @click="openDetail(prod)"
                    class="group border border-indigo-100 rounded-xl p-5 hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer relative overflow-hidden">
                    
                    <div class="absolute top-0 left-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
                        BEST {{ idx + 1 }}
                    </div>

                    <div class="flex justify-between items-start mb-3 pl-2">
                        <div>
                            <div class="text-xs font-bold text-indigo-600 mb-1">{{ prod.kor_co_nm }}</div>
                            <div class="text-lg font-bold group-hover:text-indigo-700 transition-colors">{{ prod.fin_prdt_nm }}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-gray-500">최고 우대 금리</div>
                            <div class="text-2xl font-black text-indigo-600">{{ prod.max_rate }}%</div>
                        </div>
                    </div>

                    <div class="bg-white/60 p-3 rounded-lg text-sm text-gray-600 leading-snug">
                        <span class="font-bold text-indigo-500 mr-1">Why?</span>
                        {{ prod.comment }}
                    </div>
                </div>
            </div>
        </div>

        <ProductDetailModal 
            v-if="selectedProduct" 
            :product="selectedProduct" 
            @close="selectedProduct = null" 
        />
        
    </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}
</style>