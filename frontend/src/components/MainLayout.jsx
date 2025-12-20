import React from 'react'
import { Layout, Menu, Button } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import { setAuthToken } from '../services/api'
import {
  MenuUnfoldOutlined,
  BookOutlined,
  HomeOutlined,
  FileTextOutlined,
  CloudOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  // Select primitive value to avoid returning a new object each render
  const user = useAuthStore((s) => s.user)

  const handleLogout = () => {
    useAuthStore.getState().clearAuth()
    setAuthToken(null)
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 48, margin: 16, color: '#fff', fontWeight: 700 }}>备课系统</div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={[
            { key: '/', icon: <HomeOutlined />, label: <Link to="/">概览</Link> },
            { key: '/courses', icon: <BookOutlined />, label: <Link to="/courses">课程</Link> },
            { key: '/lessons', icon: <BookOutlined />, label: <Link to="/lessons">教案</Link> },
            { key: '/resources', icon: <CloudOutlined />, label: <Link to="/resources">资源库</Link> },
            { key: '/ai', icon: <FileTextOutlined />, label: <Link to="/ai">AI</Link> }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            {user?.username ? `教师 • ${user.username}` : '教师 • 示范用户'}
          </div>
          <div>
            <Button type="link" onClick={handleLogout} style={{ marginLeft: 8 }}>
              退出登录
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 16, padding: 16, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
