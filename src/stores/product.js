import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const useProductStore = defineStore('product', () => {
    const products = ref([]) 
    const deposits = ref([]) 
    const loans = ref([])    
    const recommendation = ref(null) 
    
    // 백엔드 URL 구조 반영
    const BASE_URL = 'http://127.0.0.1:8000'
    const API_URL = `${BASE_URL}/api/v1`

    // 1. 정기예금 상품 목록 조회
    const fetchDeposits = async () => {
        try {
            const response = await axios.get(`${API_URL}/products/deposit/`)
            deposits.value = response.data
        } catch (error) {
            console.error('정기예금 목록 조회 실패:', error)
        }
    }

    // 2. 전세자금대출 상품 조회
    const fetchLoans = async () => {
        try {
            const response = await axios.get(`${API_URL}/products/loan/rent/`)
            loans.value = response.data
        } catch (error) {
            console.error('전세자금대출 목록 조회 실패:', error)
        }
    }

    // 3. AI 금융 상품 추천
    const recommendProducts = async (userQuery) => {
        const authStore = useAuthStore()
        
        if (!authStore.isAuthenticated) {
            alert("로그인이 필요한 서비스입니다.")
            return false
        }

        try {
            // 추천 알고리즘을 위한 Payload 구성
            const payload = {
                age: authStore.user?.age || 30, 
                salary: authStore.user?.salary || 40000000,
                money: authStore.user?.assets || 10000000,
                target_amount: 50000000, // 목표 금액 (임시)
                purpose: userQuery // 사용자의 입력 질문
            }

            const response = await axios.post(`${API_URL}/products/recommend/`, payload, {
                headers: {
                    Authorization: `Token ${authStore.token}`
                }
            })

            recommendation.value = response.data
            return true
        } catch (error) {
            console.error('AI 추천 요청 실패:', error)
            alert('추천 정보를 받아오지 못했습니다.')
            return false
        }
    }

    return { 
        deposits, 
        loans, 
        recommendation, 
        fetchDeposits, 
        fetchLoans, 
        recommendProducts 
    }
})