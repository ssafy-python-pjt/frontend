<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

// 1. 상태 변수
const isEditingProfile = ref(false) 
const profileForm = ref({ salary: 0, money: 0 })
const localProducts = ref([])

// 2. 초기 데이터 로드 및 동기화
onMounted(async () => {
    await authStore.fetchProfile()
    syncData()
})

const syncData = () => {
    if (!user.value) return
    
    profileForm.value.salary = user.value.salary || 0
    profileForm.value.money = user.value.money || 0

    if (user.value.joined_details) {
        localProducts.value = user.value.joined_details.map(item => {
            const productOptions = item.product.options || []
            const filteredOptions = productOptions.filter(opt => opt.save_trm === item.save_trm)
            
            // 현재 금리 결정
            let currentRate = item.intr_rate;
            if (!currentRate) {
                const matchedOption = filteredOptions.length > 0 ? filteredOptions[0] : null
                if (matchedOption) currentRate = matchedOption.intr_rate
            }

            // [수정] UI용 금리 선택자 초기화
            // 현재 금리가 옵션 목록에 있으면 그 값을, 없으면 'custom'(직접 입력)으로 설정
            const isRateInOptions = filteredOptions.some(opt => opt.intr_rate === currentRate || opt.intr_rate2 === currentRate)
            const initialSelector = isRateInOptions ? currentRate : 'custom'

            return {
                ...item,
                isEditing: false,
                amount: item.amount || 0,
                monthly_payment: item.monthly_payment || 0,
                joined_at: item.joined_at || new Date().toISOString().split('T')[0],
                intr_rate: currentRate, 
                availableOptions: filteredOptions,
                // [추가] UI 제어용 변수
                rate_selector: initialSelector
            }
        })
    }
}

// 3. 포트폴리오 계산
const portfolio = computed(() => {
    if (!user.value) return { deposit: 0, saving: 0, cash: 0, total: 0 }

    const deposit = localProducts.value
        .filter(p => p.product.product_type === 'deposit')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

    const saving = localProducts.value
        .filter(p => p.product.product_type === 'saving')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) 

    const cash = Number(user.value.money || 0)
    const total = deposit + saving + cash

    return { deposit, saving, cash, total }
})

const chartStyle = computed(() => {
    const { deposit, saving, cash, total } = portfolio.value
    if (total === 0) return { background: '#e5e7eb' } 
    const dPct = (deposit / total) * 100
    const sPct = (saving / total) * 100
    return {
        background: `conic-gradient(#4f46e5 0% ${dPct}%, #8b5cf6 ${dPct}% ${dPct + sPct}%, #10b981 ${dPct + sPct}% 100%)`
    }
})

// 자산관리 성향 분석
const financialAnalysis = computed(() => {
    const salary = Number(profileForm.value.salary) || 0
    const { total, deposit, saving, cash } = portfolio.value
    
    if (total === 0) return { type: '금융 신생아', desc: '아직 관리 중인 자산이 없습니다. 소액 적금부터 시작해보세요!', tags: ['#시작이반', '#종잣돈만들기'], color: 'bg-gray-100 text-gray-600' }
    if (salary > 0 && total < salary * 0.3) return { type: '즐거운 욜로족', desc: '소득 대비 모아둔 자산이 적은 편입니다. 미래를 위해 저축 비중을 늘려보세요.', tags: ['#소비요정', '#저축필요'], color: 'bg-yellow-100 text-yellow-700' }
    if (cash > total * 0.6) return { type: '현금 홀릭형', desc: '통장에 잠자고 있는 현금이 많습니다. 예금이나 투자 상품으로 수익률을 높여보세요.', tags: ['#안전지향', '#현금부자'], color: 'bg-emerald-100 text-emerald-700' }
    if ((deposit + saving) > total * 0.7) return { type: '성실한 개미형', desc: '차곡차곡 자산을 잘 불리고 계시네요! 꾸준함이 최고의 무기입니다.', tags: ['#저축왕', '#슈퍼그레잇'], color: 'bg-indigo-100 text-indigo-700' }
    return { type: '스마트 밸런스형', desc: '현금과 저축 상품의 균형을 잘 유지하고 계십니다.', tags: ['#황금비율', '#자산관리달인'], color: 'bg-purple-100 text-purple-700' }
})

const formatNumber = (num) => Number(num || 0).toLocaleString()

const getExpiryDate = (joinDate, months) => {
    if (!joinDate) return '-'
    const date = new Date(joinDate)
    date.setMonth(date.getMonth() + Number(months))
    return date.toISOString().split('T')[0]
}

const calculateMaturity = (item) => {
    const isSaving = item.product.product_type === 'saving'
    const principal = Number(isSaving ? item.monthly_payment : item.amount) || 0
    const period = Number(item.save_trm) || 0
    const rate = Number(item.intr_rate) || 0
    if (principal === 0 || period === 0 || rate === 0) return 0
    const rateDecimal = rate / 100
    
    if (item.intr_rate_type === 'S') {
        if (isSaving) {
            const interest = principal * (period * (period + 1) / 2) * (rateDecimal / 12)
            return Math.floor((principal * period) + interest)
        } else {
            return Math.floor(principal * (1 + rateDecimal * (period / 12)))
        }
    } else {
        const monthlyRate = rateDecimal / 12
        if (isSaving) return Math.floor(principal * (1 + monthlyRate) * (Math.pow(1 + monthlyRate, period) - 1) / monthlyRate)
        else return Math.floor(principal * Math.pow(1 + monthlyRate, period))
    }
}

const saveProfile = async () => {
    await authStore.updateProfile(profileForm.value)
    isEditingProfile.value = false
    syncData() 
}

const toggleProductEdit = (index) => {
    const item = localProducts.value[index]
    if (item.isEditing) {
        item.isEditing = false
        syncData() 
    } else {
        item.isEditing = true
    }
}

// [수정] 금리 선택 변경 핸들러
const onRateSelectChange = (item) => {
    if (item.rate_selector !== 'custom') {
        item.intr_rate = item.rate_selector
    } else {
        item.intr_rate = 0 // 직접 입력 선택 시 초기화 (또는 기존 값 유지)
    }
}

const saveProduct = async (index) => {
    const item = localProducts.value[index]
    const payload = {
        amount: item.amount, 
        monthly_payment: item.monthly_payment, 
        save_trm: item.save_trm,
        joined_at: item.joined_at,
        intr_rate: item.intr_rate,
        intr_rate_type: item.intr_rate_type
    }
    await authStore.updateJoinedProduct(item.id, payload)
    setTimeout(() => syncData(), 100)
}

const terminate = async (id) => {
    await authStore.terminateProduct(id)
    syncData()
}
</script>

<template>
    <div class="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        
        <div class="mb-10">
            <h2 class="text-3xl font-black text-gray-900">마이페이지</h2>
            <p class="text-gray-500 mt-2">나의 자산 흐름을 진단하고 포트폴리오를 관리하세요.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <h3 class="text-lg font-bold text-gray-800 mb-6 w-full border-b pb-4">자산 구성</h3>
                <div class="relative w-52 h-52 mb-6">
                    <div class="w-full h-full rounded-full shadow-inner" :style="chartStyle"></div>
                    <div class="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                        <span class="text-gray-400 text-xs">총 자산</span>
                        <span class="text-xl font-black text-gray-800">{{ formatNumber(portfolio.total) }}원</span>
                    </div>
                </div>
                <div class="w-full space-y-2 text-sm">
                    <div class="flex justify-between"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-indigo-600"></span>예금</div><span class="font-bold">{{ formatNumber(portfolio.deposit) }}</span></div>
                    <div class="flex justify-between"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-purple-500"></span>적금</div><span class="font-bold">{{ formatNumber(portfolio.saving) }}</span></div>
                    <div class="flex justify-between"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>현금</div><span class="font-bold">{{ formatNumber(portfolio.cash) }}</span></div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-4 flex items-center gap-2">
                    <i class="fa-solid fa-stethoscope text-indigo-500"></i> AI 자산 진단
                </h3>
                <div class="flex-1 flex flex-col justify-center items-center text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div class="text-4xl mb-3">🧐</div>
                    <div :class="financialAnalysis.color" class="px-3 py-1 rounded-full text-xs font-bold mb-2">
                        {{ financialAnalysis.type }}
                    </div>
                    <p class="text-gray-700 font-bold mb-3 leading-snug break-keep">
                        "{{ financialAnalysis.desc }}"
                    </p>
                    <div class="flex gap-2 justify-center flex-wrap">
                        <span v-for="tag in financialAnalysis.tags" :key="tag" class="text-xs text-gray-400">
                            {{ tag }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div class="flex justify-between items-center mb-4 border-b pb-4">
                    <h3 class="text-lg font-bold text-gray-800">기본 정보</h3>
                    <button v-if="!isEditingProfile" @click="isEditingProfile = true" class="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded hover:bg-indigo-100">수정</button>
                    <div v-else class="flex gap-2">
                        <button @click="isEditingProfile = false" class="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded hover:bg-gray-200">취소</button>
                        <button @click="saveProfile" class="text-xs text-white bg-indigo-600 px-2.5 py-1 rounded hover:bg-indigo-700 font-bold">저장</button>
                    </div>
                </div>
                <div class="flex-1 space-y-6 flex flex-col justify-center">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 mb-1">연간 소득 (세전)</label>
                        <div v-if="!isEditingProfile" class="text-2xl font-black text-gray-800">{{ formatNumber(user?.salary) }}원</div>
                        <input v-else v-model="profileForm.salary" type="number" class="w-full p-2 border border-indigo-300 rounded-lg font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-400 mb-1">보유 현금 자산</label>
                        <div v-if="!isEditingProfile" class="text-2xl font-black text-gray-800">{{ formatNumber(user?.money) }}원</div>
                        <input v-else v-model="profileForm.money" type="number" class="w-full p-2 border border-indigo-300 rounded-lg font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right">
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fa-solid fa-folder-open text-indigo-600"></i> 내 금융 상품
                <span class="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{{ localProducts.length }}</span>
            </h3>

            <div v-if="localProducts.length === 0" class="bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                <i class="fa-solid fa-inbox text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">가입된 상품이 없습니다.</p>
                <router-link to="/products" class="text-indigo-600 font-bold hover:underline mt-2 inline-block">상품 둘러보기</router-link>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div v-for="(item, index) in localProducts" :key="item.id" 
                    class="bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1"
                    :class="[item.isEditing ? 'ring-2 ring-indigo-500 z-10' : 'border border-gray-100']"
                >
                    <div class="p-5 flex justify-between items-start bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <div>
                            <span class="text-[10px] font-bold text-indigo-600 bg-white/90 px-2 py-0.5 rounded mb-2 inline-block shadow-sm">
                                {{ item.product.kor_co_nm }}
                            </span>
                            <h4 class="font-bold text-xl leading-tight text-white mb-1">{{ item.product.fin_prdt_nm }}</h4>
                            <span class="text-xs text-indigo-100 opacity-80 font-medium">
                                {{ item.product.product_type === 'deposit' ? '정기예금' : '적금' }} | {{ item.save_trm }}개월
                            </span>
                        </div>
                        <div class="flex gap-1">
                            <button v-if="!item.isEditing" @click="toggleProductEdit(index)" class="text-xs font-bold text-white bg-white/20 border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white hover:text-indigo-600 transition backdrop-blur-sm">관리</button>
                            <button v-else @click="saveProduct(index)" class="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg hover:bg-indigo-50 shadow-md">저장</button>
                        </div>
                    </div>

                    <div v-if="!item.isEditing" class="p-6 space-y-4">
                        <div class="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                            <span class="text-gray-500 font-medium">현재 예치금 (총액)</span>
                            <span class="font-black text-xl text-gray-800">{{ formatNumber(item.amount) }}원</span>
                        </div>
                        <div v-if="item.product.product_type === 'saving'" class="flex justify-between items-center text-sm">
                            <span class="text-gray-400">월 납입액</span>
                            <span class="font-bold text-gray-600">{{ formatNumber(item.monthly_payment) }}원/월</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-500">적용 금리</span>
                            <span class="font-bold text-indigo-600">{{ item.intr_rate }}% <span class="text-xs text-gray-400 font-normal">({{ item.intr_rate_type === 'S' ? '단리' : '복리' }})</span></span>
                        </div>
                        <div class="mt-4 pt-4 bg-gray-50 rounded-xl p-4">
                            <div class="flex justify-between items-end">
                                <span class="text-xs font-bold text-gray-500 mb-1">만기 예상 수령액 (세전)</span>
                                <span class="text-2xl font-black text-indigo-600">{{ formatNumber(calculateMaturity(item)) }}원</span>
                            </div>
                            <div class="text-right text-[10px] text-gray-400 mt-1">
                                만기일: {{ getExpiryDate(item.joined_at, item.save_trm) }}
                            </div>
                        </div>
                    </div>

                    <div v-else class="p-6 space-y-4 bg-white relative">
                        <div>
                            <label class="text-xs font-bold text-indigo-800 mb-1 block">현재 총 예치금(누적액)</label>
                            <input v-model="item.amount" type="number" class="w-full p-2.5 border-2 border-indigo-100 rounded-lg text-sm font-bold text-right focus:border-indigo-500 outline-none transition-colors">
                        </div>

                        <div v-if="item.product.product_type === 'saving'">
                            <label class="text-xs font-bold text-indigo-800 mb-1 block">월 납입액 변경</label>
                            <input v-model="item.monthly_payment" type="number" class="w-full p-2.5 border border-indigo-100 rounded-lg text-sm bg-gray-50 text-right">
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-xs font-bold text-gray-500 mb-1 block">금리 변경</label>
                                <select v-model="item.rate_selector" @change="onRateSelectChange(item)" class="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none mb-2">
                                    <option v-for="opt in item.availableOptions" :key="opt.id" :value="opt.intr_rate">
                                        기본 ({{ opt.intr_rate }}%)
                                    </option>
                                    <option v-for="opt in item.availableOptions" :key="opt.id + '_2'" :value="opt.intr_rate2">
                                        우대 ({{ opt.intr_rate2 }}%)
                                    </option>
                                    <option value="custom">직접 입력</option>
                                </select>
                                
                                <input v-if="item.rate_selector === 'custom'" 
                                       v-model="item.intr_rate" 
                                       type="number" step="0.01" 
                                       class="w-full p-2 border-2 border-indigo-200 rounded-lg text-sm font-bold text-right focus:border-indigo-500 outline-none animate-pulse-once"
                                       placeholder="금리 입력">
                            </div>
                            <div>
                                <label class="text-xs font-bold text-gray-500 mb-1 block">가입일 수정</label>
                                <input v-model="item.joined_at" type="date" class="w-full p-2 border border-gray-200 rounded-lg text-sm">
                            </div>
                        </div>

                        <button @click="terminate(item.id)" class="w-full py-3 mt-2 text-red-500 text-xs font-bold bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition flex justify-center items-center gap-2">
                            <i class="fa-solid fa-trash-can"></i> 이 상품 해지하기
                        </button>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes pulse-once {
    0% { transform: scale(0.98); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}
.animate-pulse-once {
    animation: pulse-once 0.2s ease-out;
}
</style>