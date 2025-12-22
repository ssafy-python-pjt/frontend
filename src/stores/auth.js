import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
    // 1. 백엔드 기본 URL 설정
    const BASE_URL = 'http://127.0.0.1:8000'
    const API_URL = `${BASE_URL}/api/v1`

    const user = ref(JSON.parse(localStorage.getItem('user')) || null)
    const token = ref(localStorage.getItem('token') || null)

    const isAuthenticated = computed(() => !!token.value)

    // [로그인] dj-rest-auth 경로는 api/v1 외부에 위치 (settings.py 참조)
    const login = async (userData) => {
        try {
            const response = await axios.post(`${BASE_URL}/dj-rest-auth/login/`, userData)
            
            // dj-rest-auth 응답 처리 (key 또는 token)
            const accessToken = response.data.key || response.data.token
            
            token.value = accessToken
            localStorage.setItem('token', token.value)

            // 로그인 후 프로필 정보 즉시 로드
            await fetchProfile()
            
        } catch (error) {
            console.error('로그인 실패:', error)
            alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.')
            throw error 
        }
    }

    // [프로필 조회]
    const fetchProfile = async () => {
        if (!token.value) return

        try {
            const response = await axios.get(`${API_URL}/profile/`, {
                headers: { Authorization: `Token ${token.value}` }
            })
            
            const userData = response.data
            
            // 백엔드 UserSerializer의 financial_products 필드를 프론트엔드 products로 매핑
            if (userData.financial_products) {
                userData.products = userData.financial_products
            } else if (!userData.products) {
                userData.products = []
            }
            
            // 자산 정보가 없으면 0으로 초기화
            if (userData.assets === undefined) userData.assets = 0

            user.value = userData
            localStorage.setItem('user', JSON.stringify(user.value))

        } catch (error) {
            console.error('프로필 정보 로드 실패:', error)
        }
    }

    // [로그아웃]
    const logout = async () => {
        try {
            if (token.value) {
                await axios.post(`${BASE_URL}/dj-rest-auth/logout/`, {}, {
                    headers: { Authorization: `Token ${token.value}` }
                })
            }
        } catch (error) {
            console.warn('서버 로그아웃 실패:', error)
        } finally {
            user.value = null
            token.value = null
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            window.location.href = '/' 
        }
    }

    // [상품 가입]
    const joinProduct = async (product) => {
        if (!user.value || !token.value) {
            alert('로그인이 필요합니다.')
            return
        }

        try {
            // URL 패턴: /api/v1/products/deposit/<fin_prdt_cd>/join/
            const response = await axios.post(
                `${API_URL}/products/deposit/${product.fin_prdt_cd}/join/`, 
                {}, 
                { headers: { Authorization: `Token ${token.value}` } }
            )

            await fetchProfile() // 가입 목록 갱신
            alert(response.data.message)

        } catch (error) {
            console.error('상품 가입 실패:', error)
            if (error.response && error.response.data) {
                alert(error.response.data.message || '가입 처리 중 오류가 발생했습니다.')
            } else {
                alert('서버와 통신할 수 없습니다.')
            }
        }
    }

    // [회원가입] dj-rest-auth 경로는 api/v1 외부에 위치
    const signup = async (userData) => {
        try {
            await axios.post(`${BASE_URL}/dj-rest-auth/registration/`, userData)
            alert('회원가입이 완료되었습니다. 로그인 해주세요.')
        } catch (error) {
            console.error('회원가입 실패:', error)
            if (error.response && error.response.data) {
                const errors = error.response.data
                let errorMessage = '회원가입에 실패했습니다.\n'
                for (const key in errors) {
                    errorMessage += `${key}: ${errors[key].join(' ')}\n`
                }
                alert(errorMessage)
            } else {
                alert('회원가입에 실패했습니다. 서버와 통신할 수 없습니다.')
            }
            throw error
        }
    }

    return { user, token, isAuthenticated, login, logout, joinProduct, fetchProfile, signup }
})