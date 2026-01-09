import React, { useState, useRef, useEffect } from 'react'
import { Card, Input, Button, message, Spin, Typography, Alert, Space } from 'antd'
import { RobotOutlined, UserOutlined, SendOutlined, ThunderboltOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const { Title } = Typography

export default function ExerciseGenerator() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  
  // 聊天相关
  const [chatHistory, setChatHistory] = useState([])
  const [userMessage, setUserMessage] = useState('')
  const chatListRef = useRef(null)

  // 自动滚动到底部
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }
  }, [chatHistory])

  // 初始化会话
  const initSession = async () => {
    const tempId = 'sess_' + Date.now()
    setSessionId(tempId)
    setChatHistory([{ 
      role: 'ai', 
      content: '您好！我是习题出题助手。请告诉我您需要出什么样的题目？\n（例如：帮我出5道关于勾股定理的选择题，难度中等）' 
    }])
  }

  useEffect(() => {
    initSession()
  }, [])

  // 发送消息
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return

    const newMessage = { role: 'user', content: userMessage }
    setChatHistory(prev => [...prev, newMessage])
    const currentMsg = userMessage
    setUserMessage('')
    setLoading(true)

    try {
      const resp = await api.post('/ai/exercise/clarify/chat', {
        session_id: sessionId,
        message: currentMsg
      })
      const aiResponse = resp.data?.ai_message || resp.data?.message || '收到。'
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }])
    } catch (err) {
      message.error('发送失败')
    } finally {
      setLoading(false)
    }
  }

  // 立即生成并保存
  const handleGenerateAndSave = async () => {
    if (chatHistory.length < 2) {
      message.warning('请先告诉 AI 您想要什么题目')
      return
    }

    setLoading(true)
    try {
      // 1. 自动确认
      const lastAiMsg = [...chatHistory].reverse().find(m => m.role === 'ai')
      const confirmText = lastAiMsg ? lastAiMsg.content : 'User confirmed.'

      await api.post('/ai/exercise/clarify/confirm', {
        session_id: sessionId,
        confirm_md_final: confirmText
      })

      // 2. 生成并保存
      message.loading('正在生成并保存到题库...', 1)
      await api.post('/ai/exercise/generate', {
        session_id: sessionId
      })

      message.success('习题生成成功！')
      // 生成成功后跳转回列表页
      navigate('/exercises')
      
    } catch (err) {
      console.error(err)
      message.error('生成失败: ' + (err?.response?.data?.detail || '请重试'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
           <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/exercises')}>返回列表</Button>
           <Title level={3} style={{ margin: 0 }}>AI 智能出题</Title>
        </Space>
        <Button 
          type="primary" 
          size="large"
          icon={<ThunderboltOutlined />} 
          onClick={handleGenerateAndSave}
          loading={loading}
          disabled={chatHistory.length < 2}
        >
          生成并保存
        </Button>
      </div>

      <Card bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }} style={{ flex: 1, overflow: 'hidden' }}>
        <div 
          ref={chatListRef}
          style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#fafafa' }}
        >
          {chatHistory.map((msg, idx) => {
            const isUser = msg.role === 'user'
            return (
              <div key={idx} style={{ marginBottom: 20, textAlign: isUser ? 'right' : 'left' }}>
                <div style={{ 
                  display: 'inline-block', 
                  maxWidth: '80%', 
                  textAlign: 'left',
                  padding: '12px 16px', 
                  borderRadius: '12px', 
                  borderTopRightRadius: isUser ? '2px' : '12px',
                  borderTopLeftRadius: isUser ? '12px' : '2px',
                  backgroundColor: isUser ? '#1890ff' : '#fff', 
                  color: isUser ? '#fff' : '#333',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '12px', marginBottom: 4, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isUser ? <UserOutlined /> : <RobotOutlined />} 
                    {isUser ? '我' : 'AI 助手'}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</div>
                </div>
              </div>
            )
          })}
          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              <Spin /> 正在思考中...
            </div>
          )}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input 
              size="large"
              value={userMessage} 
              onChange={e => setUserMessage(e.target.value)} 
              onPressEnter={handleSendMessage}
              placeholder="请输入您的出题需求..." 
              disabled={loading}
            />
            <Button 
              size="large" 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleSendMessage} 
              loading={loading}
            >
              发送
            </Button>
          </Space.Compact>
        </div>
      </Card>
    </div>
  )
}