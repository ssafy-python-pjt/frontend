<script setup>
import { onMounted, ref, watch } from 'vue'

const mapContainer = ref(null)

// 데이터 상태 관리
const regionData = ref([])   
const bankData = ref([])     

// 선택된 값들
const selectedSido = ref('')
const selectedSigungu = ref('')
const selectedBank = ref('')

// 화면 표시용
const filteredSigungu = ref([])
const isMapError = ref(false) // 지도 로드 실패 여부
const isMapLoading = ref(true) // 지도 로딩 중 상태

let map = null
let markers = []
let infowindow = null

// Kakao Map 스크립트 로드 (Timeout 적용)
const loadKakaoMap = () => {
  const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY
  
  if (!KAKAO_API_KEY) {
    isMapError.value = true
    isMapLoading.value = false
    return
  }

  // 이미 로드된 경우
  if (window.kakao && window.kakao.maps) {
    initMap()
    return
  }

  const script = document.createElement('script')
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${KAKAO_API_KEY}&libraries=services`
  
  // [핵심] 로드 실패 시 예외 처리
  script.onerror = () => {
    console.error('Kakao Map 스크립트 로드 실패')
    isMapError.value = true
    isMapLoading.value = false
  }

  script.onload = () => {
    window.kakao.maps.load(() => {
      initMap()
    })
  }

  document.head.appendChild(script)

  // [핵심] 3초 내에 로드 안 되면 타임아웃 처리 (네트워크 차단 대응)
  setTimeout(() => {
    if (isMapLoading.value && !map) {
      console.warn('Kakao Map 로드 타임아웃 (네트워크 차단 가능성)')
      isMapError.value = true
      isMapLoading.value = false
    }
  }, 3000)
}

// 지도 초기화
const initMap = () => {
  if (!mapContainer.value) return

  try {
    const options = {
      center: new window.kakao.maps.LatLng(37.5012743, 127.039585), 
      level: 3
    }
    map = new window.kakao.maps.Map(mapContainer.value, options)
    infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 })
    
    // 로딩 성공 처리
    isMapLoading.value = false
    isMapError.value = false

    // 데이터 로드
    loadRegionAndBankData()
  } catch (err) {
    console.error('지도 생성 중 에러:', err)
    isMapError.value = true
    isMapLoading.value = false
  }
}

// 데이터 로드
const loadRegionAndBankData = async () => {
  try {
    const response = await fetch('/data/data.json') 
    if (!response.ok) throw new Error('파일 없음')
    const json = await response.json()
    regionData.value = json.mapInfo || []
    bankData.value = json.bankInfo || []
  } catch (e) {
    // Fallback 데이터
    regionData.value = [
      { name: '서울', countries: ['강남구', '서초구', '송파구', '마포구'] },
      { name: '부산', countries: ['해운대구', '진구', '수영구'] },
      { name: '대전', countries: ['유성구', '서구'] },
      { name: '광주', countries: ['광산구', '동구'] }
    ]
    bankData.value = ['국민은행', '신한은행', '우리은행', '하나은행', '농협은행']
  }
}

watch(selectedSido, (newVal) => {
  selectedSigungu.value = '' 
  if (!newVal) {
    filteredSigungu.value = []
    return
  }
  const targetRegion = regionData.value.find(r => r.name === newVal)
  filteredSigungu.value = targetRegion ? targetRegion.countries : []
})

// 검색 실행
const onSearchClick = () => {
  if (isMapError.value) {
    alert('지도를 불러오지 못해 검색할 수 없습니다.')
    return
  }
  if (!map || !window.kakao) return
  if (!selectedSido.value || !selectedSigungu.value || !selectedBank.value) {
    alert('검색 조건을 모두 선택해 주세요.')
    return
  }

  const keyword = `${selectedSido.value} ${selectedSigungu.value} ${selectedBank.value}`
  const ps = new window.kakao.maps.services.Places()
  
  ps.keywordSearch(keyword, (data, status) => {
    if (status === window.kakao.maps.services.Status.OK) {
      const bounds = new window.kakao.maps.LatLngBounds()
      displayMarkers(data)
      data.forEach(place => bounds.extend(new window.kakao.maps.LatLng(place.y, place.x)))
      map.setBounds(bounds)
    } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
      alert('검색 결과가 존재하지 않습니다.')
    } else {
      alert('검색 중 오류가 발생했습니다.')
    }
  })
}

const displayMarkers = (places) => {
  clearMarkers()
  places.forEach((place) => {
    const marker = new window.kakao.maps.Marker({
      map: map,
      position: new window.kakao.maps.LatLng(place.y, place.x)
    })
    markers.push(marker)
    window.kakao.maps.event.addListener(marker, 'click', () => {
      const content = `
        <div style="padding:10px; min-width:200px; font-size:12px;">
          <h4 style="font-weight:bold; margin-bottom:4px; color:#4F46E5;">${place.place_name}</h4>
          <p>${place.road_address_name || place.address_name}</p>
          <a href="${place.place_url}" target="_blank" style="color:blue; display:block; margin-top:4px;">상세보기</a>
        </div>
      `
      infowindow.setContent(content)
      infowindow.open(map, marker)
    })
  })
}

const clearMarkers = () => {
  markers.forEach(marker => marker.setMap(null))
  markers = []
}

onMounted(() => {
  loadKakaoMap()
})
</script>

<template>
  <div class="bg-white p-4 rounded-xl shadow-sm h-[600px] flex flex-col relative overflow-hidden">
    
    <div class="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-3 w-72">
      <h3 class="text-base font-bold text-gray-800 flex items-center">
        <i class="fa-solid fa-location-dot mr-2 text-indigo-600"></i> 은행 찾기
      </h3>
      
      <div class="space-y-2">
        <select v-model="selectedSido" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors">
          <option value="">광역시/도 선택</option>
          <option v-for="region in regionData" :key="region.name" :value="region.name">{{ region.name }}</option>
        </select>
        <select v-model="selectedSigungu" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors" :disabled="!selectedSido">
          <option value="">시/군/구 선택</option>
          <option v-for="sigungu in filteredSigungu" :key="sigungu" :value="sigungu">{{ sigungu }}</option>
        </select>
        <select v-model="selectedBank" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors">
          <option value="">은행 선택</option>
          <option v-for="bank in bankData" :key="bank" :value="bank">{{ bank }}</option>
        </select>
      </div>

      <button @click="onSearchClick" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-all flex justify-center items-center gap-2 mt-1">
        <span>검색하기</span>
        <i class="fa-solid fa-magnifying-glass"></i>
      </button>
    </div>
    
    <div ref="mapContainer" class="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center relative z-10">
        
        <div v-if="isMapLoading" class="text-center text-gray-400">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-2"></i>
            <p>지도를 불러오는 중입니다...</p>
        </div>

        <div v-else-if="isMapError" class="text-center text-gray-400 p-8 bg-gray-50 rounded-xl border border-gray-200">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-3 text-amber-500"></i>
            <h4 class="font-bold text-gray-800 mb-1">지도를 불러올 수 없습니다.</h4>
            <p class="text-xs mb-4">네트워크 환경(방화벽) 문제이거나 API 키가 올바르지 않습니다.</p>
            <div class="text-[10px] text-left bg-white p-3 rounded border text-gray-500">
              * SSAFY 내부망에서는 보안상의 이유로 지도 이미지가 차단될 수 있습니다.<br>
              * 모바일 핫스팟 등 외부망을 연결하여 확인해주세요.
            </div>
        </div>
    </div>
  </div>
</template>