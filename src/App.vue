<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">
    
    <header class="bg-white border-b sticky top-0 z-50 h-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div class="flex justify-between items-center h-full">
          
          <div class="flex items-center gap-8">
            <RouterLink to="/" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <i class="fa-solid fa-wallet text-sm"></i>
              </div>
              <span class="font-bold text-xl text-gray-900 group-hover:text-indigo-700 transition">FINAI</span>
            </RouterLink>

            <nav class="hidden md:flex gap-6 text-sm font-medium text-gray-600">
              <RouterLink to="/products" active-class="text-indigo-600 font-bold" class="hover:text-indigo-600 transition">예적금 비교</RouterLink>
              <RouterLink to="/commodities" active-class="text-indigo-600 font-bold" class="hover:text-indigo-600 transition">현물(금/은)</RouterLink>
              <RouterLink to="/youtube" active-class="text-indigo-600 font-bold" class="hover:text-indigo-600 transition">금융 Youtube</RouterLink>
              <RouterLink to="/map" active-class="text-indigo-600 font-bold" class="hover:text-indigo-600 transition">은행 찾기</RouterLink>
              <RouterLink to="/community" active-class="text-indigo-600 font-bold" class="hover:text-indigo-600 transition">커뮤니티</RouterLink>
            </nav>
          </div>

          <div class="flex items-center gap-3">
            <template v-if="authStore.isAuthenticated">
              <RouterLink to="/recommend" class="hidden md:inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-100 transition border border-indigo-100">
                <i class="fa-solid fa-robot"></i> AI 추천
              </RouterLink>
              
              <div class="h-4 w-px bg-gray-300 mx-1 hidden md:block"></div>

              <RouterLink to="/profile" class="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition">
                <span class="text-sm font-bold hidden md:block">{{ authStore.user?.username || '회원' }}님</span>
                <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <i class="fa-solid fa-user text-gray-500"></i>
                </div>
              </RouterLink>
              
              <button @click="authStore.logout" class="text-sm text-gray-500 hover:text-red-500 ml-2">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </template>

            <template v-else>
              <RouterLink to="/login" class="text-gray-500 hover:text-indigo-600 text-sm font-medium px-2">로그인</RouterLink>
              <RouterLink to="/signup" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm">회원가입</RouterLink>
            </template>
          </div>

        </div>
      </div>
    </header>

    <main class="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16 sm:mb-0">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <nav class="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around py-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] text-[10px]">
        <RouterLink to="/products" active-class="text-indigo-600 font-bold" class="flex flex-col items-center gap-1 p-2 text-gray-400 w-full">
          <i class="fa-solid fa-piggy-bank text-xl"></i>
          <span>예적금</span>
        </RouterLink>
        <RouterLink to="/commodities" active-class="text-indigo-600 font-bold" class="flex flex-col items-center gap-1 p-2 text-gray-400 w-full">
          <i class="fa-solid fa-chart-line text-xl"></i>
          <span>시세</span>
        </RouterLink>
        <RouterLink to="/map" active-class="text-indigo-600 font-bold" class="flex flex-col items-center gap-1 p-2 text-gray-400 w-full">
          <i class="fa-solid fa-map-location-dot text-xl"></i>
          <span>은행</span>
        </RouterLink>
        <RouterLink to="/community" active-class="text-indigo-600 font-bold" class="flex flex-col items-center gap-1 p-2 text-gray-400 w-full">
          <i class="fa-solid fa-comments text-xl"></i>
          <span>소통</span>
        </RouterLink>
        <RouterLink to="/profile" active-class="text-indigo-600 font-bold" class="flex flex-col items-center gap-1 p-2 text-gray-400 w-full">
          <i class="fa-solid fa-user text-xl"></i>
          <span>MY</span>
        </RouterLink>
    </nav>

    <footer class="bg-gray-800 text-white py-8 mt-auto hidden md:block">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <p class="mb-2 font-bold text-lg">SSAFY 14th Financial Project - FINAI</p>
        <p class="text-gray-400 text-sm">© 2025 FINAI Corp. All rights reserved.</p>
        <div class="mt-4 flex justify-center space-x-6 text-xl">
            <a href="#" class="text-gray-400 hover:text-white transition"><i class="fa-brands fa-github"></i></a>
            <a href="#" class="text-gray-400 hover:text-white transition"><i class="fa-brands fa-instagram"></i></a>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* 페이지 전환 애니메이션 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>