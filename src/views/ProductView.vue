<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/product'
import { storeToRefs } from 'pinia'
import ProductDetailModal from '@/components/ProductDetailModal.vue' // [추가] 공통 모달 컴포넌트

// 스토어 연결
const productStore = useProductStore()
const { deposits, savings, loans } = storeToRefs(productStore)

// 상태 변수들
const activeTab = ref('deposit') // deposit, saving, loan
const filterBank = ref('all')
const filterTerm = ref('all') // 가입 기간 필터
const searchQuery = ref('')
const sortTarget = ref('max') // intr_rate(기본) 또는 intr_rate2(최고)
const sortOrder = ref('desc') 
const selectedProduct = ref(null) // 모달에 표시할 선택된 상품

// 탭 변경 로직
const changeTab = (tab) => {
    activeTab.value = tab
    filterBank.value = 'all'
    filterTerm.value = 'all'
    searchQuery.value = ''
    selectedProduct.value = null // 탭 변경 시 모달 닫기
    
    if (tab === 'deposit') productStore.fetchDeposits()
    else if (tab === 'saving') productStore.fetchSavings()
    else if (tab === 'loan') productStore.fetchLoans()
}

// 초기 로딩
onMounted(() => {
    productStore.fetchDeposits()
})

// 은행 목록 추출 (필터용)
const bankList = computed(() => {
    const target = activeTab.value === 'deposit' ? deposits.value : 
                   activeTab.value === 'saving' ? savings.value : loans.value
    return [...new Set(target.map(p => p.kor_co_nm))].sort()
})

// 상품 필터링 및 정렬 핵심 로직
const filteredProducts = computed(() => {
    let list = []
    if (activeTab.value === 'deposit') list = deposits.value
    else if (activeTab.value === 'saving') list = savings.value
    else if (activeTab.value === 'loan') list = loans.value

    // 1. 옵션 평탄화 (Option Flattening) - 옵션별로 별도 카드로 분리
    return list.flatMap(product => {
        if (!product.options || product.options.length === 0) return [product]
        
        return product.options.map(opt => ({
            ...product, // 상품 기본 정보
            ...opt,     // 옵션 상세 정보 (금리, 기간 등) 덮어쓰기
            id: `${product.fin_prdt_cd}_${opt.save_trm || opt.lend_rate_type_nm}` // 고유 ID 생성
        }))
    })
    // 2. 조건 필터링
    .filter(p => {
        const bankMatch = filterBank.value === 'all' || p.kor_co_nm === filterBank.value
        const termMatch = filterTerm.value === 'all' || String(p.save_trm) === filterTerm.value
        const searchMatch = p.fin_prdt_nm.includes(searchQuery.value) || p.kor_co_nm.includes(searchQuery.value)
        return bankMatch && termMatch && searchMatch
    })
    // 3. 정렬 (Sort)
    .sort((a, b) => {
        let valA, valB
        if (activeTab.value === 'loan') {
            valA = a.lend_rate_min || 0; valB = b.lend_rate_min || 0
        } else {
            valA = sortTarget.value === 'max' ? (a.intr_rate2 || 0) : (a.intr_rate || 0)
            valB = sortTarget.value === 'max' ? (b.intr_rate2 || 0) : (b.intr_rate || 0)
        }
        return sortOrder.value === 'desc' ? (valB - valA) : (valA - valB)
    })
})

// 모달 열기
const openDetail = (product) => {
    selectedProduct.value = product
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
    
    <div class="mb-8 flex justify-between items-end">
        <div>
            <h2 class="text-3xl font-black text-gray-900 mb-2">금융 상품 비교</h2>
            <p class="text-gray-500">전국의 예적금 및 대출 금리를 한눈에 비교해보세요.</p>
        </div>
        <div v-if="filteredProducts.length === 0" class="text-xs text-red-500 font-bold bg-red-50 p-2 rounded border border-red-100">
            * 데이터가 로딩 중이거나 없습니다. 검색 조건을 변경하거나 백엔드 서버를 확인해주세요.
        </div>
    </div>

    <div class="bg-white p-6 rounded-2xl shadow-sm mb-6 space-y-4">
        <div class="flex p-1 bg-gray-100 rounded-xl w-fit">
            <button v-for="tab in [['deposit','정기예금'], ['saving','적금'], ['loan','전세자금대출']]" 
                :key="tab[0]" @click="changeTab(tab[0])"
                :class="activeTab === tab[0] ? 'bg-white shadow text-indigo-600' : 'text-gray-500'"
                class="px-8 py-2.5 rounded-lg text-sm font-bold transition-all">
                {{ tab[1] }}
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input v-model="searchQuery" type="text" placeholder="상품명 또는 은행 검색" 
                class="col-span-1 md:col-span-1 px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
            
            <select v-model="filterBank" class="px-4 py-2 border border-gray-200 rounded-lg outline-none">
                <option value="all">모든 은행</option>
                <option v-for="bank in bankList" :key="bank" :value="bank">{{ bank }}</option>
            </select>

            <select v-if="activeTab !== 'loan'" v-model="filterTerm" class="px-4 py-2 border border-gray-200 rounded-lg outline-none">
                <option value="all">모든 기간</option>
                <option v-for="t in ['6', '12', '24', '36']" :key="t" :value="t">{{ t }}개월</option>
            </select>

            <select v-model="sortTarget" v-if="activeTab !== 'loan'" class="px-4 py-2 border border-gray-200 rounded-lg outline-none">
                <option value="max">최고 금리순</option>
                <option value="basic">기본 금리순</option>
            </select>
        </div>
    </div>

    <div class="space-y-3">
        <div v-for="product in filteredProducts" :key="product.id" 
            @click="openDetail(product)"
            class="group bg-white border border-gray-100 p-5 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex justify-between items-center">
            
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded">{{ product.kor_co_nm }}</span>
                    <span v-if="product.save_trm" class="text-xs text-gray-400">{{ product.save_trm }}개월</span>
                </div>
                <h3 class="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{{ product.fin_prdt_nm }}</h3>
            </div>

            <div class="text-right">
                <div class="text-[11px] text-gray-400 font-bold mb-1">
                    {{ activeTab === 'loan' ? '최저 금리' : '최고 우대금리' }}
                </div>
                <div class="text-2xl font-black text-indigo-600">
                    {{ activeTab === 'loan' ? product.lend_rate_min : product.intr_rate2 }}%
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