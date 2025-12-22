<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isLogin = ref(true) // 기본값은 로그인 폼
const username = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const email = ref('')

// 라우트 변경 감지하여 로그인/회원가입 폼 전환
watch(() => route.path, (newPath) => {
    isLogin.value = newPath === '/login'
}, { immediate: true })

const handleLogin = async () => {
    if (!username.value || !password.value) {
        alert('아이디와 비밀번호를 입력하세요.')
        return
    }
    try {
        await authStore.login({ username: username.value, password: password.value })
        router.push('/')
    } catch (error) {
        // 에러는 authStore에서 이미 처리했으므로 별도 처리 없음
    }
}

const handleSignup = async () => {
    if (!username.value || !password.value || !passwordConfirmation.value || !email.value) {
        alert('모든 필드를 입력하세요.')
        return
    }
    if (password.value !== passwordConfirmation.value) {
        alert('비밀번호가 일치하지 않습니다.')
        return
    }
    try {
        await authStore.signup({ username: username.value, password1: password.value, password2: passwordConfirmation.value, email: email.value })
        // 회원가입 성공 후 로그인 페이지로 이동
        router.push({ name: 'login' })
    } catch (error) {
        // 에러는 authStore에서 이미 처리했으므로 별도 처리 없음
    }
}

const toggleForm = () => {
    if (isLogin.value) {
        router.push({ name: 'signup' })
    } else {
        router.push({ name: 'login' })
    }
}
</script>

<template>
  <div class="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md mt-10">
    <h2 class="text-2xl font-bold mb-6 text-center">{{ isLogin ? '로그인' : '회원가입' }}</h2>
    <form @submit.prevent="isLogin ? handleLogin() : handleSignup()" class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-gray-700">아이디</label>
            <input v-model="username" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="아이디">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">비밀번호</label>
            <input v-model="password" type="password" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="비밀번호">
        </div>
        <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700">비밀번호 확인</label>
            <input v-model="passwordConfirmation" type="password" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="비밀번호 확인">
        </div>
        <div v-if="!isLogin">
            <label class="block text-sm font-medium text-gray-700">이메일</label>
            <input v-model="email" type="email" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="email@example.com">
        </div>
        <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition">{{ isLogin ? '로그인' : '회원가입' }}</button>
    </form>
    <div class="mt-4 text-center text-sm">
        <span class="text-gray-500">{{ isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?' }}</span>
        <button @click="toggleForm" class="text-indigo-600 font-medium ml-1">{{ isLogin ? '회원가입' : '로그인' }}</button>
    </div>
  </div>
</template>