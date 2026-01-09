import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import useAuthStore from '../stores/authStore' 

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
        </Form>
      </Card>
    </div>
  )
}
