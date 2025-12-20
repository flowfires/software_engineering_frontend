import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import useAuthStore from '../stores/authStore'
import { setAuthToken } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const onFinish = async (values) => {
    try {
      await login(values)
      message.success('登录成功')
      navigate('/')
    } catch (err) {
      message.error(err?.response?.data?.message || '登录失败')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ width: 360 }}>
        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}> 
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            还没有账号？ <a onClick={() => navigate('/register')}>立即注册</a>
          </div>
          {import.meta.env.DEV && (
            <Form.Item>
              <Button
                block
                onClick={() => {
                  // 开发时的临时后门，直接注入 token（仅本次会话，不持久化）
                  const mockToken = 'dev-token'
                  const mockUser = { username: 'dev' }
                  setAuthToken(mockToken)
                  useAuthStore.getState().setAuth(mockToken, mockUser)
                  // mark this as a dev session so App will skip token verification
                  useAuthStore.getState().setDevSession(true)
                  // remove persisted storage so it doesn't auto-login after refresh
                  try {
                    localStorage.removeItem('auth-storage')
                  } catch (e) {}
                  message.success('开发后门：已登录（session）')
                  navigate('/')
                }}
              >
                开发后门登录
              </Button>
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  )
}
