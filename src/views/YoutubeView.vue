<script setup>
import { ref } from 'vue'
import axios from 'axios'

const query = ref('')
const videos = ref([])
const selectedVideo = ref(null)

// ★ Google API Key 입력 필요
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

const searchYoutube = async () => {
    if (!query.value) return
    
    if (!YOUTUBE_API_KEY) {
        // API Key 없을 때 Mock Data
        videos.value = [
            { id: { videoId: 'video1' }, snippet: { title: `${query.value} 관련 뉴스`, channelTitle: '경제TV', publishedAt: '2023-12-01', thumbnails: { high: { url: 'https://via.placeholder.com/320x180' } } } },
            { id: { videoId: 'video2' }, snippet: { title: '초보자를 위한 가이드', channelTitle: '금융스쿨', publishedAt: '2023-11-20', thumbnails: { high: { url: 'https://via.placeholder.com/320x180' } } } }
        ]
        return
    }

    try {
        const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: YOUTUBE_API_KEY,
                part: 'snippet',
                q: query.value,
                type: 'video',
                maxResults: 6
            }
        })
        videos.value = res.data.items
    } catch (error) {
        console.error(error)
        alert('검색 허용량을 초과했거나 키가 잘못되었습니다.')
    }
}
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm min-h-[600px]">
    <h2 class="text-2xl font-bold mb-6 text-red-600"><i class="fa-brands fa-youtube mr-2"></i>금융 튜브</h2>
    
    <div class="flex gap-2 mb-6">
        <input v-model="query" @keyup.enter="searchYoutube" class="flex-grow border px-4 py-2 rounded-lg" placeholder="검색어 입력 (예: 재테크)">
        <button @click="searchYoutube" class="bg-red-600 text-white px-6 py-2 rounded-lg font-bold">검색</button>
    </div>

    <div v-if="selectedVideo" class="mb-8">
        <div class="aspect-w-16 aspect-h-9 bg-black rounded-xl overflow-hidden mb-4">
            <iframe :src="`https://www.youtube.com/embed/${selectedVideo.id.videoId}`" class="w-full h-[400px]" frameborder="0" allowfullscreen></iframe>
        </div>
        <button @click="selectedVideo = null" class="text-blue-600 underline">닫기</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="video in videos" :key="video.id.videoId" @click="selectedVideo = video" class="cursor-pointer group">
            <img :src="video.snippet.thumbnails.high.url" class="w-full rounded-lg mb-2 group-hover:opacity-90">
            <h4 class="font-bold line-clamp-2">{{ video.snippet.title }}</h4>
            <p class="text-sm text-gray-500">{{ video.snippet.channelTitle }}</p>
        </div>
    </div>
  </div>
</template>