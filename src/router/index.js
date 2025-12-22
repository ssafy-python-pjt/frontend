import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// View 컴포넌트 임포트
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import ProductView from '@/views/ProductView.vue'
import CommoditiesView from '@/views/CommoditiesView.vue'
import YoutubeView from '@/views/YoutubeView.vue'
import BankMapView from '@/views/BankMapView.vue'
import CommunityView from '@/views/CommunityView.vue'
import ProfileView from '@/views/ProfileView.vue'
import RecommendView from '@/views/RecommendView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      name: 'home', 
      component: HomeView 
    },
    { 
      path: '/login', 
      name: 'login', 
      component: LoginView 
    },
    { 
      path: '/signup', 
      name: 'signup', 
      component: LoginView // 회원가입 페이지 별도 구현 시 변경 필요
    },
    { 
      path: '/products', 
      name: 'products', 
      component: ProductView 
    },
    { 
      path: '/commodities', 
      name: 'commodities', 
      component: CommoditiesView 
    },
    { 
      path: '/youtube', 
      name: 'youtube', 
      component: YoutubeView 
    },
    { 
      path: '/map', 
      name: 'map', 
      component: BankMapView 
    },
    { 
      path: '/community', 
      name: 'community', 
      component: CommunityView 
    },
    { 
      path: '/profile', 
      name: 'profile', 
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    { 
      path: '/recommend', 
      name: 'recommend', 
      component: RecommendView,
      meta: { requiresAuth: true }
    }
  ]
})

// 네비게이션 가드 (로그인 필요 페이지 접근 제한)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 인증이 필요한 페이지인데 로그인이 안 되어 있다면
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    alert('로그인이 필요한 서비스입니다.')
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router