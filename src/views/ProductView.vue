<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/product'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const productStore = useProductStore()
const authStore = useAuthStore()
const { deposits, loans } = storeToRefs(productStore)

const filterBank = ref('all')
const activeTab = ref('deposit') // deposit, loan
const selectedProduct = ref(null)
const sortOrder = ref('desc') // 정렬 순서: desc(높은순), asc(낮은순)

onMounted(() => {
    productStore.fetchDeposits()
    productStore.fetchLoans()
})

// [추가] 모든 상품에서 중복되지 않은 은행 목록 추출
const bankList = computed(() => {
    const allProducts = [...deposits.value, ...loans.value]
    const bankNames = allProducts.map(product => product.kor_co_nm)
    return [...new Set(bankNames)] // Set을 이용해 중복 제거
})

// 데이터 가공 및 필터링 로직
const filteredProducts = computed(() => {
    let targetList = []
    if (activeTab.value === 'deposit') {
        targetList = deposits.value
    } else if (activeTab.value === 'loan') {
        targetList = loans.value
    }

    // 1. 데이터 평탄화 (Flattening): 옵션 내부의 금리 정보를 바깥으로 꺼냄
    const processedList = targetList.map(product => {
        // 옵션이 있는 경우
        if (product.options && product.options.length > 0) {
            // [팁] 예금의 경우 가장 금리가 높은 옵션(보통 12개월 이상)을 대표값으로 쓸 수도 있습니다.
            // 여기서는 첫 번째 옵션을 사용하되, 정렬 시 intr_rate2(우대금리)를 비교합니다.
            const opt = product.options[0] 
            return {
                ...product,
                // 대출 관련
                lend_rate_min: opt.lend_rate_min,
                lend_rate_max: opt.lend_rate_max,
                lend_rate_avg: opt.lend_rate_avg,
                rpay_type_nm: opt.rpay_type_nm,
                lend_rate_type_nm: opt.lend_rate_type_nm,
                // 예금 관련
                intr_rate: opt.intr_rate,
                intr_rate2: opt.intr_rate2,
                intr_rate_type_nm: opt.intr_rate_type_nm,
                save_trm: opt.save_trm
            }
        } 
        // 옵션이 없는 경우 (null 처리)
        else {
            return {
                ...product,
                lend_rate_min: null,
                lend_rate_max: null,
                lend_rate_avg: null,
                rpay_type_nm: '정보 없음',
                lend_rate_type_nm: '정보 없음',
                intr_rate: null,
                intr_rate2: null,
                intr_rate_type_nm: '정보 없음'
            }
        }
    })

    // 2. 필터링 및 정렬
    return processedList
        .filter(p => {
            // [수정] 선택된 은행명과 정확히 일치하는지 확인 (DB에서 추출했으므로 일치함)
            if (filterBank.value === 'all') return true
            return p.kor_co_nm === filterBank.value
        })
        .sort((a, b) => {
            // 정렬 기준 값 설정 (예금: 우대금리, 대출: 최저금리)
            let rateA, rateB
            
            if (activeTab.value === 'deposit') {
                rateA = a.intr_rate2
                rateB = b.intr_rate2
            } else {
                rateA = a.lend_rate_min
                rateB = b.lend_rate_min
            }

            // null 값은 항상 맨 뒤로 보내기
            if (rateA === null || rateA === undefined) return 1
            if (rateB === null || rateB === undefined) return -1

            // 정렬 로직
            if (sortOrder.value === 'desc') {
                return rateB - rateA // 높은순 (내림차순)
            } else {
                return rateA - rateB // 낮은순 (오름차순)
            }
        })
})

const openDetail = (product) => selectedProduct.value = product
const closeDetail = () => selectedProduct.value = null
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-6 min-h-[600px]">
    <h2 class="text-2xl font-bold mb-6">금융 상품 조회</h2>
    
    <div class="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div class="flex space-x-2">
            <button @click="activeTab='deposit'" :class="{'bg-blue-600 text-white': activeTab==='deposit', 'bg-gray-200 text-gray-700': activeTab!=='deposit'}" class="px-4 py-2 rounded-lg text-sm font-medium transition">정기예금</button>
            <button @click="activeTab='loan'" :class="{'bg-green-600 text-white': activeTab==='loan', 'bg-gray-200 text-gray-700': activeTab!=='loan'}" class="px-4 py-2 rounded-lg text-sm font-medium transition">전세자금대출</button>
        </div>

        <div class="flex gap-2">
            <select v-model="filterBank" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 max-w-[200px]">
                <option value="all">모든 은행</option>
                <option v-for="bankName in bankList" :key="bankName" :value="bankName">
                    {{ bankName }}
                </option>
            </select>

            <select v-model="sortOrder" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="desc">금리 높은순</option>
                <option value="asc">금리 낮은순</option>
            </select>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-4">
        <div v-for="product in filteredProducts" :key="product.fin_prdt_cd || product.id" @click="openDetail(product)" class="border rounded-lg p-5 hover:border-indigo-500 hover:shadow-md cursor-pointer transition flex justify-between items-center group">
            <div>
                <div class="text-xs font-bold text-indigo-600 mb-1">{{ product.kor_co_nm }}</div>
                <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-700">{{ product.fin_prdt_nm }}</h3>
                <div class="text-sm text-gray-500 mt-1">
                    <span v-if="activeTab === 'deposit'">
                        <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1">{{ product.intr_rate_type_nm }}</span>
                        <span v-if="product.save_trm" class="text-xs text-gray-500 mr-1">{{ product.save_trm }}개월</span>
                        {{ product.join_member }}
                    </span>
                    <span v-else>
                         <span class="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-1">{{ product.rpay_type_nm }}</span>
                         한도: {{ product.loan_lmt }}
                    </span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-xs text-gray-500">
                    {{ activeTab === 'deposit' ? '최고 우대금리' : '최저 금리' }}
                </div>
                <div class="text-2xl font-bold text-indigo-600">
                    <span v-if="activeTab === 'deposit'">
                        {{ product.intr_rate2 ? product.intr_rate2 + '%' : '-' }}
                    </span>
                    <span v-else>
                        {{ product.lend_rate_min ? product.lend_rate_min + '%' : '-' }}
                    </span>
                </div>
            </div>
        </div>
        <div v-if="filteredProducts.length === 0" class="text-center py-10 text-gray-400">
            조회된 상품이 없습니다.
        </div>
    </div>

    <div v-if="selectedProduct" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeDetail">
        <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-indigo-600 font-bold text-sm">{{ selectedProduct.kor_co_nm }}</span>
                        <h3 class="text-2xl font-bold">{{ selectedProduct.fin_prdt_nm }}</h3>
                    </div>
                    <button @click="closeDetail" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-times text-xl"></i></button>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg mb-6 space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">금융회사</span>
                        <span class="font-bold">{{ selectedProduct.kor_co_nm }}</span>
                    </div>
                    
                    <template v-if="activeTab === 'deposit'">
                         <div class="flex justify-between">
                            <span class="text-gray-600">기본 금리</span>
                            <span class="font-bold">{{ selectedProduct.intr_rate ? selectedProduct.intr_rate + '%' : '-' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">최고 우대 금리</span>
                            <span class="font-bold text-indigo-600">{{ selectedProduct.intr_rate2 ? selectedProduct.intr_rate2 + '%' : '-' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">가입 기간</span>
                            <span>{{ selectedProduct.save_trm ? selectedProduct.save_trm + '개월' : '-' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">금리 유형</span>
                            <span>{{ selectedProduct.intr_rate_type_nm }}</span>
                        </div>
                    </template>
                    
                    <template v-else>
                         <div class="flex justify-between">
                            <span class="text-gray-600">최저 금리</span>
                            <span class="font-bold text-blue-600">{{ selectedProduct.lend_rate_min ? selectedProduct.lend_rate_min + '%' : '-' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">최고 금리</span>
                            <span class="font-bold text-red-600">{{ selectedProduct.lend_rate_max ? selectedProduct.lend_rate_max + '%' : '-' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">대출 한도</span>
                            <span>{{ selectedProduct.loan_lmt }}</span>
                        </div>
                    </template>
                </div>
                
                <div class="mt-4">
                     <p class="text-sm text-gray-600 whitespace-pre-line mb-4">{{ selectedProduct.etc_note }}</p>
                </div>

                <button v-if="authStore.isAuthenticated" @click="authStore.joinProduct(selectedProduct); closeDetail();" class="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">가입하기</button>
                <button v-else @click="$router.push('/login')" class="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-bold cursor-not-allowed">로그인 후 가입 가능</button>
            </div>
        </div>
    </div>
  </div>
</template>