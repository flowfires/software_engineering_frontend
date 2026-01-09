import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
 
  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        full_name: values.fullName
      })
      message.success('注册成功，请登录')
      navigate('/login')
    } catch (err) {
      message.error(err?.response?.data?.detail || '注册失败')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <Card style={{ width: 520 }} title="注册新教师账号">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="fullName" label="真实姓名"> 
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}> 
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true }]}> 
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
