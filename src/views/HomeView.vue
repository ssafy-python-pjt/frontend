<template>
  <div class="space-y-12">
    <!-- Banner -->
    <div class="relative bg-indigo-700 rounded-2xl overflow-hidden shadow-xl text-white h-80 flex items-center">
      <div class="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1565514020176-db79238b6d87?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
      <div class="relative z-10 px-6 md:px-10 max-w-2xl">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">당신의 자산을 불려줄 최고의 선택</h1>
        <p class="text-lg md:text-xl mb-6 text-indigo-100">Bankbook에서 모든 은행의 금리를 비교하고, <br class="hidden md:block">AI 추천을 통해 스마트하게 투자하세요.</p>
        <RouterLink to="/products" class="bg-white text-indigo-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg inline-block">금리 비교하러 가기</RouterLink>
      </div>
    </div>
    <!-- Core Features -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer transform hover:-translate-y-1" @click="$router.push('/products')">
            <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-xl"><i class="fa-solid fa-piggy-bank"></i></div>
            <h3 class="text-lg font-bold mb-2">예적금 비교</h3>
            <p class="text-gray-500 text-sm">전체 금융권의 정기예금, 적금 금리를 한눈에 비교하세요.</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer transform hover:-translate-y-1" @click="$router.push('/commodities')">
            <div class="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4 text-xl"><i class="fa-solid fa-chart-line"></i></div>
            <h3 class="text-lg font-bold mb-2">현물 시세</h3>
            <p class="text-gray-500 text-sm">금, 은 등 원자재 가격 변동을 그래프로 확인하세요.</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer transform hover:-translate-y-1" @click="$router.push('/map')">
            <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-xl"><i class="fa-solid fa-map-location-dot"></i></div>
            <h3 class="text-lg font-bold mb-2">근처 은행</h3>
            <p class="text-gray-500 text-sm">내 위치 주변의 은행 지점을 찾고 경로를 확인하세요.</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer transform hover:-translate-y-1" @click="$router.push('/youtube')">
            <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 text-xl"><i class="fa-brands fa-youtube"></i></div>
            <h3 class="text-lg font-bold mb-2">금융 튜브</h3>
            <p class="text-gray-500 text-sm">최신 금융 트렌드와 재테크 영상을 검색해보세요.</p>
        </div>
    </div>
  </div>
</template>