<script setup>
import { ref, onMounted } from 'vue'
import { useArticleStore } from '@/stores/article'
import { useAuthStore } from '@/stores/auth'

const articleStore = useArticleStore()
const authStore = useAuthStore()

// --- 상태 관리 ---
const isWriting = ref(false)
const selectedArticle = ref(null) 
const isEditing = ref(false)

// [추가] 삭제 모달 관련 상태
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

// 폼 데이터
const newArticle = ref({ title: '', content: '' })
const editForm = ref({ title: '', content: '' })

onMounted(() => {
    articleStore.fetchArticles()
})

// --- 글쓰기 ---
const handleSubmit = async () => {
    if (!authStore.isAuthenticated) return alert('로그인이 필요합니다.')
    if (!newArticle.value.title || !newArticle.value.content) return alert('내용을 입력하세요')
    
    await articleStore.createArticle(newArticle.value)
    isWriting.value = false
    newArticle.value = { title: '', content: '' }
}

// --- 상세 조회 ---
const openDetail = (article) => {
    selectedArticle.value = article
    isEditing.value = false
}

const closeDetail = () => {
    selectedArticle.value = null
    isEditing.value = false
}

// --- 수정 ---
const startEdit = () => {
    editForm.value = { ...selectedArticle.value }
    isEditing.value = true
}

const handleUpdate = async () => {
    await articleStore.updateArticle(selectedArticle.value.id, editForm.value)
    selectedArticle.value = { ...selectedArticle.value, ...editForm.value }
    isEditing.value = false
}

// --- [변경] 삭제 프로세스 ---

// 1. 삭제 버튼 클릭 시: 모달 열기
const openDeleteModal = (id) => {
    deleteTargetId.value = id
    showDeleteModal.value = true
}

// 2. 모달에서 '확인' 클릭 시: 실제 삭제 실행
const confirmDelete = async () => {
    if (deleteTargetId.value) {
        await articleStore.deleteArticle(deleteTargetId.value)
        showDeleteModal.value = false // 삭제 모달 닫기
        deleteTargetId.value = null
        closeDetail() // 상세 모달도 닫기
    }
}

// 3. 모달에서 '취소' 클릭 시
const cancelDelete = () => {
    showDeleteModal.value = false
    deleteTargetId.value = null
}
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm min-h-[600px]">
    <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">🗣️ 소통 공간</h2>
        <button v-if="authStore.isAuthenticated" 
                @click="isWriting = !isWriting" 
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            {{ isWriting ? '닫기' : '글쓰기' }}
        </button>
    </div>

    <div v-if="isWriting" class="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200 shadow-inner">
        <input v-model="newArticle.title" class="w-full p-3 border rounded mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="제목을 입력하세요">
        <textarea v-model="newArticle.content" class="w-full p-3 border rounded h-32 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="내용을 자유롭게 작성하세요"></textarea>
        <div class="text-right">
            <button @click="handleSubmit" class="bg-indigo-600 text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 transition">등록하기</button>
        </div>
    </div>

    <div class="space-y-4">
        <div v-for="article in articleStore.articles" 
             :key="article.id" 
             @click="openDetail(article)"
             class="border rounded-lg p-5 hover:bg-gray-50 transition cursor-pointer relative group shadow-sm">
            <h3 class="font-bold text-lg text-gray-800">{{ article.title }}</h3>
            <p class="text-gray-600 text-sm mt-2 mb-4 line-clamp-2">{{ article.content }}</p>
            <div class="text-xs text-gray-400 flex justify-between items-center border-t pt-3">
                <span class="font-semibold text-indigo-500">{{ article.user || '익명' }}</span>
                <span>{{ new Date(article.created_at).toLocaleDateString() }}</span>
            </div>
        </div>
        <div v-if="articleStore.articles.length === 0" class="text-center py-20 text-gray-400">
            게시글이 없습니다.
        </div>
    </div>

    <div v-if="selectedArticle" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeDetail">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative">
            
            <div class="p-6 border-b flex justify-between items-start bg-gray-50">
                <div class="w-full">
                    <input v-if="isEditing" v-model="editForm.title" class="w-full p-2 border rounded font-bold text-xl" >
                    <h3 v-else class="text-2xl font-bold text-gray-900">{{ selectedArticle.title }}</h3>
                    <div class="text-sm text-gray-500 mt-2 flex gap-4">
                        <span>작성자: {{ selectedArticle.user }}</span>
                        <span>{{ new Date(selectedArticle.created_at).toLocaleString() }}</span>
                    </div>
                </div>
                <button @click="closeDetail" class="text-gray-400 hover:text-gray-600 ml-4"><i class="fa-solid fa-xmark text-2xl"></i></button>
            </div>

            <div class="p-6 min-h-[200px]">
                <textarea v-if="isEditing" v-model="editForm.content" class="w-full h-64 p-3 border rounded resize-none"></textarea>
                <p v-else class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ selectedArticle.content }}</p>
            </div>

            <div v-if="authStore.user?.username === selectedArticle.user" class="p-4 border-t bg-gray-50 flex justify-end gap-2">
                <template v-if="!isEditing">
                    <button @click="startEdit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">수정</button>
                    <button @click="openDeleteModal(selectedArticle.id)" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">삭제</button>
                </template>
                <template v-else>
                    <button @click="handleUpdate" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">저장</button>
                    <button @click="isEditing = false" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">취소</button>
                </template>
            </div>
        </div>
    </div>

    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center transform transition-all scale-100">
            <div class="mb-4">
                <i class="fa-solid fa-circle-exclamation text-4xl text-red-500 mb-3"></i>
                <h3 class="text-lg font-bold text-gray-900">게시글 삭제</h3>
                <p class="text-gray-500 text-sm mt-2">정말 삭제하시겠습니까?<br>삭제된 글은 복구할 수 없습니다.</p>
            </div>
            <div class="flex justify-center gap-3 mt-6">
                <button @click="cancelDelete" class="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition">
                    취소
                </button>
                <button @click="confirmDelete" class="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition shadow-md">
                    삭제하기
                </button>
            </div>
        </div>
    </div>

  </div>
</template>