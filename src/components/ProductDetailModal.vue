<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// 1. Props & Emits 정의
const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()

// 2. 상품 타입 판별 (대출 여부)
const isLoan = computed(() => {
  if (!props.product) return false
  return props.product.product_type === 'loan' || 
         props.product.lend_rate_min !== undefined ||
         props.product.fin_prdt_nm.includes('전세')
})

// 3. 금리 표시용 로직
// (1) 최고/최저 금리 (강조용)
const displayMaxRate = computed(() => {
  if (!props.product) return 0
  return props.product.max_rate || props.product.intr_rate2 || props.product.lend_rate_min || 0
})

// (2) 기본 금리 (일반용)
const displayBasicRate = computed(() => {
  if (!props.product) return 0
  return props.product.intr_rate || props.product.lend_rate_max || 0
})

// 4. 가입하기 로직
const handleJoin = async () => {
  if (!authStore.isAuthenticated) {
    alert('로그인이 필요한 서비스입니다.')
    return
  }

  const confirmMsg = `[${props.product.kor_co_nm}] ${props.product.fin_prdt_nm}\n상품에 가입하시겠습니까?`
  if (confirm(confirmMsg)) {
    await authStore.joinProduct(props.product)
    emit('close')
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
      
      <div class="p-6 border-b border-gray-100 flex justify-between items-start bg-indigo-600 shrink-0">
        <div>
          <span class="text-xs font-bold text-indigo-100 bg-indigo-500/50 px-2 py-1 rounded mb-2 inline-block border border-indigo-400/30">
            {{ product.kor_co_nm }}
          </span>
          <h3 class="text-xl md:text-2xl font-bold text-white leading-tight">
            {{ product.fin_prdt_nm }}
          </h3>
        </div>
        <button @click="$emit('close')" class="text-white/70 hover:text-white transition-colors p-1">
          <i class="fa-solid fa-xmark text-2xl"></i>
        </button>
      </div>

      <div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
        
        <div v-if="product.comment" class="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div class="flex items-center gap-2 mb-2 text-indigo-700 font-bold text-sm">
            <i class="fa-solid fa-robot"></i> AI 추천 사유
          </div>
          <p class="text-sm text-gray-700 leading-relaxed">
            {{ product.comment }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 p-3 rounded-xl">
            <p class="text-xs text-gray-500 mb-1">가입/대출 기간</p>
            <p class="font-bold text-gray-800">{{ product.save_trm ? product.save_trm + '개월' : '유동적' }}</p>
          </div>
          <div class="bg-gray-50 p-3 rounded-xl">
            <p class="text-xs text-gray-500 mb-1">이자 계산 방식</p>
            <p class="font-bold text-gray-800">{{ product.intr_rate_type_nm || '단리' }}</p>
          </div>
          
          <div class="bg-white border border-gray-200 p-3 rounded-xl">
            <p class="text-xs text-gray-500 mb-1">
                {{ isLoan ? '최고 금리' : '기본 금리' }}
            </p>
            <p class="font-bold text-gray-800 text-lg">
                {{ displayBasicRate }}%
            </p>
          </div>

          <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
            <p class="text-xs text-indigo-500 mb-1 font-bold">
               {{ isLoan ? '최저 금리' : '최고 우대 금리' }}
            </p>
            <p class="font-black text-indigo-600 text-xl">
              {{ displayMaxRate }}%
            </p>
          </div>
        </div>

        <div class="space-y-4 text-sm">
           <div v-if="product.spcl_cnd" class="bg-blue-50 p-4 rounded-xl border border-blue-100">
             <span class="font-bold text-blue-700 block mb-1">🎁 우대 조건</span>
             <p class="text-gray-700 whitespace-pre-line leading-relaxed">{{ product.spcl_cnd }}</p>
           </div>

           <div v-if="product.join_way">
             <span class="font-bold text-gray-700 block mb-1">📌 가입 방법</span>
             <p class="text-gray-600">{{ product.join_way }}</p>
           </div>
           
           <div v-if="product.etc_note">
             <span class="font-bold text-gray-700 block mb-1">💡 유의사항</span>
             <p class="text-gray-500 text-xs bg-gray-50 p-3 rounded-lg leading-relaxed">{{ product.etc_note }}</p>
           </div>
        </div>

      </div>

      <div class="p-4 bg-gray-50 flex gap-3 shrink-0 border-t border-gray-200">
        <button @click="$emit('close')" class="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">
          닫기
        </button>
        <button v-if="!isLoan" @click="handleJoin" class="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
          <span>이 상품 가입하기</span>
          <i class="fa-solid fa-check"></i>
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c7c7c7;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>