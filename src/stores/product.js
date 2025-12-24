import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const useProductStore = defineStore('product', () => {
    // 1. 상태 정의: 예금, 적금, 대출을 각각 분리하여 관리
    const deposits = ref([])      // 정기예금
    const savings = ref([])       // 적금
    const loans = ref([])         // 전세자금대출
    const recommendation = ref(null)
    const showResult = ref(false)

    const BASE_URL = 'http://127.0.0.1:8000'
    const API_URL = `${BASE_URL}/api/v1`

    // 2. 정기예금 목록 조회 (type=deposit 파라미터 사용)
    const fetchDeposits = async () => {
        try {
            const response = await axios.get(`${API_URL}/products/deposit/`, {
                params: { type: 'deposit' }
            })
            deposits.value = response.data
        } catch (error) {
            console.error('정기예금 목록 조회 실패:', error)
        }
    }

    // 3. 적금 목록 조회 (type=saving 파라미터 사용) [추가]
    const fetchSavings = async () => {
        try {
            const response = await axios.get(`${API_URL}/products/deposit/`, {
                params: { type: 'saving' }
            })
            savings.value = response.data
        } catch (error) {
            console.error('적금 목록 조회 실패:', error)
        }
    }

    // 4. 전세자금대출 상품 조회
    const fetchLoans = async () => {
        try {
            const response = await axios.get(`${API_URL}/products/loan/rent/`)
            loans.value = response.data
        } catch (error) {
            console.error('전세자금대출 목록 조회 실패:', error)
        }
    }

    // 5. AI 금융 상품 추천 (기존 로직 유지하되 필요 시 페이로드 확장 가능)
    const recommendProducts = async (userQuery) => {
        const authStore = useAuthStore()

        if (!authStore.isAuthenticated) {
            alert("로그인이 필요한 서비스입니다.")
            return false
        }

        try {
            // 백엔드 recommend_product 뷰의 요구사항에 맞춰 페이로드 구성
            const payload = {
                age: authStore.user?.age || 30,
                salary: authStore.user?.salary || 40000000,
                money: authStore.user?.money || 10000000, // models.py의 필드명 'money' 반영
                purpose: userQuery
            }

            const response = await axios.post(`${API_URL}/products/recommend/`, payload, {
                headers: {
                    Authorization: `Token ${authStore.token}`
                }
            })

            recommendation.value = response.data
            showResult.value = true
            return true
        } catch (error) {
            console.error('AI 추천 요청 실패:', error)
            alert('추천 정보를 받아오지 못했습니다.')
            return false
        }
    }

    return {
        deposits,
        savings,
        loans,
        recommendation,
        showResult,
        fetchDeposits,
        fetchSavings,
        fetchLoans,
        recommendProducts
    }
})