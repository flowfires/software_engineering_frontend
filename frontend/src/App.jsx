import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, message, theme } from 'antd'
import { 
  BookOutlined, 
  UserOutlined, 
  LogoutOutlined, 
  RobotOutlined,
  FileTextOutlined,
  FormOutlined
} from '@ant-design/icons'

// 引入页面组件
import Login from './pages/Login'
import Register from './pages/Register'
import Lessons from './pages/Lessons'
import LessonWizard from './pages/LessonWizard'
import LessonEditor from './pages/LessonEditor'
import Resources from './pages/Resources'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Exercises from './pages/Exercises' // 列表页
import ExerciseGenerator from './pages/ExerciseGenerator' // 生成页
import ExerciseEditor from './pages/ExerciseEditor' // 编辑页
import LearningProfiles from './pages/LearningProfiles'
import ImageGeneration from './pages/ImageGeneration';
import VideoGeneration from './pages/VideoGeneration';


import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

const { Header, Content, Sider } = Layout

function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  // 兼容用户信息中可能包含 avatar_base64 而非 avatar_url
  const avatarSrc = user?.avatar_url || (user?.avatar_base64 ? (user.avatar_base64.startsWith('data:') ? user.avatar_base64 : `data:image/jpeg;base64,${user.avatar_base64}`) : undefined)
  console.log('[App] current user avatarSrc:', avatarSrc)

  const menuItems = [
    {
      key: '/lessons',
      icon: <BookOutlined />,
      label: '教案管理',
      onClick: () => navigate('/lessons')
    },

    {
      key: '/exercises',
      icon: <FormOutlined />,
      label: '习题管理',
      onClick: () => navigate('/exercises')
    },
    {
      key: '/learning-profiles',
      icon: <RobotOutlined />,
      label: '学情分析',
      onClick: () => navigate('/learning-profiles')
    },
    {
      key: '/resources',
      icon: <FileTextOutlined />,
      label: '资源中心',
      onClick: () => navigate('/resources')
    },
  ]

  const userMenu = {
    items: [
      {
        key: 'profile',
        label: <Link to="/profile">个人信息</Link>,
        icon: <UserOutlined />
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        danger: true,
        onClick: () => {
          logout()
          message.success('已退出登录')
          navigate('/login')
        }
      }
    ]
  }

  if (['/login', '/register'].includes(location.pathname)) {
    return children
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: '#fff', lineHeight: '32px', fontWeight: 'bold', overflow: 'hidden' }}>
          {collapsed ? 'AI' : 'AI 备课助手'}
        </div>
        <Menu 
          theme="dark" 
          defaultSelectedKeys={['/lessons']} 
          selectedKeys={[location.pathname]} 
          mode="inline" 
          items={menuItems} 
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} src={avatarSrc} />
              <span style={{ fontWeight: 500 }}>{user?.full_name || user?.username || '教师'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: 8 }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 教案相关 */}
          <Route path="/" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
          <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
          <Route path="/lessons/wizard" element={<ProtectedRoute><LessonWizard /></ProtectedRoute>} />
          <Route path="/lessons/new" element={<ProtectedRoute><LessonEditor /></ProtectedRoute>} />
          <Route path="/lessons/:id" element={<ProtectedRoute><LessonEditor /></ProtectedRoute>} />
          
          
          {/* 习题相关 - 新增路由 */}
          <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
          <Route path="/exercises/new" element={<ProtectedRoute><ExerciseGenerator /></ProtectedRoute>} />
          <Route path="/exercises/:id" element={<ProtectedRoute><ExerciseEditor /></ProtectedRoute>} />

          {/* 学情分析 */}
          <Route path="/learning-profiles" element={<ProtectedRoute><LearningProfiles /></ProtectedRoute>} />
          
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/resources/image" element={<ProtectedRoute><ImageGeneration /></ProtectedRoute>} />
          <Route path="/resources/video" element={<ProtectedRoute><VideoGeneration /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}