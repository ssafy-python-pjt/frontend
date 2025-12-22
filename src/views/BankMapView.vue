<script setup>
import { onMounted, ref, watch } from 'vue'

const mapContainer = ref(null)

// 데이터 상태 관리
const regionData = ref([])   // 전체 지역 데이터
const bankData = ref([])     // 전체 은행 데이터

// 선택된 값들 (v-model로 연결)
const selectedSido = ref('')
const selectedSigungu = ref('')
const selectedBank = ref('')

// 화면에 표시할 시군구 목록
const filteredSigungu = ref([])

let map
let markers = []
let infowindow

// Kakao Map 스크립트 로드
const loadKakaoMap = () => {
  const script = document.createElement('script')
  // [중요] 실제 발급받은 카카오 API 키를 입력하세요.
  const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY
  script.src = `//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${KAKAO_API_KEY}&libraries=services`
  script.onload = () => {
    window.kakao.maps.load(() => {
      initMap()
    })
  }
  document.head.appendChild(script)
}

// 지도 초기화
const initMap = () => {
  const options = {
    center: new window.kakao.maps.LatLng(37.5012743, 127.039585), // 초기 좌표 (역삼)
    level: 3
  }
  map = new window.kakao.maps.Map(mapContainer.value, options)
  infowindow = new window.kakao.maps.InfoWindow({ zIndex: 1 })
}

// 데이터 로드 (JSON fetch)
const loadRegionAndBankData = async () => {
  try {
    // 실제 프로젝트 환경에 맞는 경로로 수정 필요
    const response = await fetch('/data/data.json') 
    if (!response.ok) throw new Error('data.json 로딩 실패')

    const json = await response.json()
    regionData.value = json.mapInfo
    bankData.value = json.bankInfo
    
  } catch (e) {
    console.error('데이터 로드 실패:', e)
    // 테스트를 위해 더미 데이터를 넣어둘 수도 있습니다.
    alert('데이터 로딩에 실패했습니다. 경로를 확인해주세요.')
  }
}

// 시/도 선택이 변경되면 시/군/구 목록 업데이트
watch(selectedSido, (newVal) => {
  selectedSigungu.value = '' // 시도가 바뀌면 시군구 초기화
  
  if (!newVal) {
    filteredSigungu.value = []
    return
  }

  const targetRegion = regionData.value.find(r => r.name === newVal)
  if (targetRegion) {
    filteredSigungu.value = targetRegion.countries // countries가 시군구 배열이라고 가정
  } else {
    filteredSigungu.value = []
  }
})

// 검색 버튼 클릭
const onSearchClick = () => {
  if (!selectedSido.value || !selectedSigungu.value || !selectedBank.value) {
    alert('광역시/도, 시/군/구, 은행을 모두 선택해 주세요.')
    return
  }

  // 검색 키워드 조합 (예: 서울 강남구 국민은행)
  const keyword = `${selectedSido.value} ${selectedSigungu.value} ${selectedBank.value}`
  searchPlaces(keyword)
}

// 장소 검색
const searchPlaces = (keyword) => {
  if (!map || !window.kakao) return

  const ps = new window.kakao.maps.services.Places(map)
  clearMarkers()

  console.log('검색 키워드:', keyword)

  ps.keywordSearch(keyword, (data, status) => {
    if (status === window.kakao.maps.services.Status.OK) {
      displayPlaces(data)
    } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
      alert('검색 결과가 없습니다.')
    } else {
      alert('검색 중 오류가 발생했습니다.')
    }
  })
}

// 마커 표시
const displayPlaces = (places) => {
  const bounds = new window.kakao.maps.LatLngBounds()

  places.forEach((place) => {
    const position = new window.kakao.maps.LatLng(place.y, place.x)
    const marker = new window.kakao.maps.Marker({
      map: map,
      position: position
    })

    markers.push(marker)

    window.kakao.maps.event.addListener(marker, 'click', () => {
      const content = `
        <div style="padding:5px;font-size:12px;color:black;">
          <strong>${place.place_name}</strong><br/>
          ${place.road_address_name || place.address_name}
        </div>
      `
      infowindow.setContent(content)
      infowindow.open(map, marker)
    })

    bounds.extend(position)
  })

  map.setBounds(bounds)
}

// 마커 제거
const clearMarkers = () => {
  markers.forEach((marker) => marker.setMap(null))
  markers = []
}

onMounted(() => {
  loadKakaoMap()
  loadRegionAndBankData()
})
</script>

<template>
  <div class="bg-white p-4 rounded-xl shadow-sm h-[600px] flex flex-col relative">
    
    <div class="absolute top-6 left-6 z-10 bg-white p-4 rounded-lg shadow-md flex flex-col gap-3 w-64 border border-gray-200">
      <h3 class="text-sm font-bold text-gray-700">은행 검색</h3>
      
      <select v-model="selectedSido" class="border rounded px-2 py-1 text-sm">
        <option value="">광역시/도 선택</option>
        <option v-for="region in regionData" :key="region.name" :value="region.name">
          {{ region.name }}
        </option>
      </select>

      <select v-model="selectedSigungu" class="border rounded px-2 py-1 text-sm">
        <option value="">시/군/구 선택</option>
        <option v-for="sigungu in filteredSigungu" :key="sigungu" :value="sigungu">
          {{ sigungu }}
        </option>
      </select>

      <select v-model="selectedBank" class="border rounded px-2 py-1 text-sm">
        <option value="">은행 선택</option>
        <option v-for="bank in bankData" :key="bank" :value="bank">
          {{ bank }}
        </option>
      </select>

      <button @click="onSearchClick" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors">
        검색하기
      </button>
    </div>
    
    <div ref="mapContainer" class="w-full h-full rounded bg-gray-100 flex items-center justify-center">
        <div class="text-center text-gray-500">
            <i class="fa-solid fa-map-location-dot text-4xl mb-2"></i>
            <p>지도를 불러오는 중입니다...</p>
        </div>
    </div>
  </div>
</template>