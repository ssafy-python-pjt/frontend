import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const useArticleStore = defineStore('article', () => {
    const API_URL = 'http://127.0.0.1:8000/api/v1'
    const articles = ref([])

    // 1. 목록 조회
    const fetchArticles = async () => {
        try {
            const response = await axios.get(`${API_URL}/articles/`)
            articles.value = response.data
        } catch (error) {
            console.error('게시글 로드 실패:', error)
        }
    }

    // 2. 글 작성
    const createArticle = async (payload) => {
        const authStore = useAuthStore()
        try {
            await axios.post(`${API_URL}/articles/`, payload, {
                headers: { Authorization: `Token ${authStore.token}` }
            })
            await fetchArticles() 
        } catch (error) {
            console.error('작성 실패:', error)
            alert('로그인이 필요합니다.')
        }
    }

    // [추가] 3. 글 수정 (PUT)
    const updateArticle = async (id, payload) => {
        const authStore = useAuthStore()
        try {
            await axios.put(`${API_URL}/articles/${id}/`, payload, {
                headers: { Authorization: `Token ${authStore.token}` }
            })
            await fetchArticles() // 목록 갱신
        } catch (error) {
            console.error('수정 실패:', error)
            alert('수정 권한이 없거나 오류가 발생했습니다.')
            throw error
        }
    }

    // 4. 글 삭제
    const deleteArticle = async (articleId) => {
        const authStore = useAuthStore()
        try {
            await axios.delete(`${API_URL}/articles/${articleId}/`, {
                headers: { Authorization: `Token ${authStore.token}` }
            })
            await fetchArticles()
        } catch (error) {
            console.error('삭제 실패:', error)
            alert('삭제 권한이 없습니다.')
        }
    }

    return { articles, fetchArticles, createArticle, updateArticle, deleteArticle }
})