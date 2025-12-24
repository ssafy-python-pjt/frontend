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

    // [로그인] 토큰 저장 후 프로필 정보를 불러옵니다.
    const login = async (userData) => {
        try {
            const response = await axios.post(`${BASE_URL}/dj-rest-auth/login/`, userData)
            const accessToken = response.data.key || response.data.token

            token.value = accessToken
            localStorage.setItem('token', token.value)

            await fetchProfile()
        } catch (error) {
            console.error('로그인 실패:', error)
            alert('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.')
            throw error
        }
    }

    // [프로필 조회] 가입한 상품의 상세 옵션(금리, 기간 등)을 포함한 유저 정보를 가져옵니다.
    const fetchProfile = async () => {
        if (!token.value) return

        try {
            const response = await axios.get(`${API_URL}/profile/`, {
                headers: { Authorization: `Token ${token.value}` }
            })

            // 가입 상품 상세 내역(joined_details)이 포함된 데이터를 user 상태에 저장
            user.value = response.data
            localStorage.setItem('user', JSON.stringify(user.value))
        } catch (error) {
            console.error('프로필 정보 로드 실패:', error)
        }
    }

    // [로그아웃] 상태 및 로컬 스토리지 초기화
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

    // [회원가입]
    const signup = async (userData) => {
        try {
            await axios.post(`${BASE_URL}/dj-rest-auth/registration/`, userData)
            alert('회원가입이 완료되었습니다. 로그인 해주세요.')
        } catch (error) {
            console.error('회원가입 실패:', error)
            throw error
        }
    }

    // [유저 기본 정보 수정] 나이, 연봉, 자산 등 수정 (숫자 형식 데이터 전송)
    const updateProfile = async (profileData) => {
        try {
            const response = await axios.put(`${API_URL}/profile/update/`, profileData, {
                headers: { Authorization: `Token ${token.value}` }
            })
            user.value = response.data
            localStorage.setItem('user', JSON.stringify(user.value))
            alert('기본 정보가 수정되었습니다.')
            return true
        } catch (error) {
            console.error('프로필 수정 실패:', error)
            alert('정보 수정 중 오류가 발생했습니다.')
            return false
        }
    }

    // [상품 가입] 가입 시 기본 기간 등을 설정하여 백엔드에 전달
    const joinProduct = async (product) => {
        if (!user.value || !token.value) {
            alert('로그인이 필요합니다.')
            return
        }
        try {
            const response = await axios.post(
                `${API_URL}/products/deposit/${product.fin_prdt_cd}/join/`,
                {},
                { headers: { Authorization: `Token ${token.value}` } }
            )
            await fetchProfile() // 가입 후 목록 갱신
            alert(response.data.message)
        } catch (error) {
            alert(error.response?.data?.message || '가입 처리 중 오류가 발생했습니다.')
        }
    }

    // [가입 상품 상세 수정] 기간(save_trm), 납입액 등을 수정하고 만기 수령액 계산을 위해 프로필을 재로딩합니다.
    const updateJoinedProduct = async (joinedId, payload) => {
        try {
            await axios.put(`${API_URL}/products/joined/${joinedId}/`, payload, {
                headers: { Authorization: `Token ${token.value}` }
            })
            // 수정 후 즉시 프로필을 다시 불러와 가입 기간별 금리 및 만기 금액 계산 결과 반영
            await fetchProfile()
            alert('상품 정보가 성공적으로 수정되었습니다.')
        } catch (error) {
            console.error('상품 정보 수정 실패:', error)
            alert('상세 정보 저장에 실패했습니다. 입력값을 확인해주세요.')
        }
    }

    // [상품 해지] 중개 모델의 PK를 이용해 삭제 요청
    const terminateProduct = async (joinedId) => {
        if (!confirm('정말 이 상품을 해지하시겠습니까?')) return

        try {
            await axios.delete(`${API_URL}/products/joined/${joinedId}/`, {
                headers: { Authorization: `Token ${token.value}` }
            })
            await fetchProfile() // 해지 후 자산 포트폴리오 차트 갱신을 위해 호출
            alert('상품이 해지되었습니다.')
        } catch (error) {
            console.error('상품 해지 실패:', error)
            alert('해지 처리 중 오류가 발생했습니다.')
        }
    }

    return {
        user,
        token,
        isAuthenticated,
        login,
        logout,
        signup,
        fetchProfile,
        updateProfile,
        joinProduct,
        updateJoinedProduct,
        terminateProduct
    }
})